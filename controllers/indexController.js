require("dotenv").config()
const asyncHandler = require("express-async-handler")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const User = require("../models/user")
const Friends = require("../models/friends")
const Post = require("../models/post")

exports.login_get = asyncHandler(async (req, res, next) => {
  if (!req.token) {
    res.render("login", { title: "Login" })
  }
})
exports.login_post = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return res.json({ errors: err })
    }
    if (user === false) {
      const error = new Error("User not found!")
      error.status = 404
      return res.json({ errors: error })
    } else {
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token })
    }
  })(req, res, next)
}

// learn how to incorporate oauth w/ facebook and google
// do i need to change my user schema?
// do i need to do a verify email?
// how do I add the options to the passport.authenticate fn? aka differentiate between
// how to organize/structure this new code (separate folders for local, fb, google?)


exports.signup_get = asyncHandler(async (req, res, next) => {
  res.render("signup", { title: "Signup" })
})
exports.signup_post = [
  body("first_name", "Please add your first name.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("family_name", "Please add your family name.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("email", "Please add your email address.")
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .withMessage("Must be a valid email address!")
    .escape(),
  body("password", "Password required, must be at least 6 characters.")
    .trim()
    .isLength({ min: 6 })
    .escape(),
  body("confirm_password", "Passwords did not match.")
    .trim()
    .custom((value, { req }) => {
      return value === req.body.password
    })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req)
    const salt = 12
    bcrypt.hash(req.body.password, salt, async(err, hashedPassword) => {
      if (err) {
        return next(err)
      }
      const friendlist = new Friends({
        list: [],
        pending: [],
        request: [],
      })
      const user = new User({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        email: req.body.email,
        loginid: {
          hash: hashedPassword,
          googleid: null,
          fbid: null,
        },
        friend_list: friendlist._id,
      })
      if (!errors.isEmpty()) {
        res.json({ errors: errors.array(), user })
        return
      } else {
        const emailExists = await User.findOne({ email: req.body.email }).exec()
        if (emailExists) {
          const error = new Error("Email address already associated with an account!")
          error.status = 404 
          console.log(error.message)
          res.json({ errors: error, user })
        } else {
          await friendlist.save()
          await user.save()
          res.json({
            title: "User Profile",
            user,
          })
        }
      }
    })
  })
]

exports.profile_get = asyncHandler(async(req, res, next) => {
  const posts = await Post.find({ author: req.user.user._id }).exec()
  return res.json({ user: req.user.user, profile: req.user.user, posts })
})
exports.profile_detail_get = asyncHandler(async(req, res, next) => {
  const user = await User.findById(req.params.id).exec()
  const posts = await Post.find({ author: req.params.id }).exec()
  return res.json({ user: req.user.user, profile: user, posts })
})
// should these two be bunched together? 
// would make for only one db query, and just return an allposts and a someposts...
exports.posts_all_get = asyncHandler(async(req, res, next) => {
  const posts = await Post.find({}).exec()
  res.json({ posts })
})
exports.posts_other_get = asyncHandler(async(req, res, next) => {
  const posts = await Post.find({}).exec()
  const others = posts.filter(item => {
    return item.author != req.user.user._id
  })
  res.json({ posts: others })
})

exports.friends_get = asyncHandler(async(req, res, next) => {
  const friends = await Friends.findById(req.user.user.friend_list).exec()
  return res.json({ user: req.user.user, friends_list: friends.list, friends_pending: friends.pending, friends_request: friends.request })
})
const alreadyFriend = (friend_list, userid) => {
  let answer = false
  const friend = friend_list.list.filter(item => item == userid) 
  if (friend.length > 0) {
    answer = true
    return [answer, "User is already on your friend list."]
  }
  const pending = friend_list.pending.filter(item => item == userid)
  if (pending.length > 0) {
    answer = true
    return [answer, "User will be added to your friend list after they accept your request."]
  }
  const request = friend_list.request.filter(item => item == userid)
  if (request.length > 0) {
    answer = true
    return [answer, "User will be added to your friend list after you accept their request."]
  }
  return answer
}
// these next 3 functions could be refactored...a lot of repeated code
// need to confirm that alreadyFriends works across the board
// then refactor these..?
exports.friends_send_request_post = asyncHandler(async(req, res, next) => {
  // needs to check if user is already friends with other user...
  // get user's friend list
  const user_list = await Friends.findById(req.user.user.friend_list).exec()
  const already = alreadyFriend(user_list, req.body.userid)
  if (already[0]) {
    const error = new Error(already[1])
    error.status = 403
    res.json({ errors: error })
  } else {
    // create new friend list, but use same _id
    const user_newlist = new Friends({
      list: user_list.list,
      pending: user_list.pending,
      request: user_list.request,
      _id: user_list._id,
    })
    // get other user
    // and use populate to get friend list
    const other_user = await User.findById(req.body.userid).populate("friend_list").exec()
    const other_list = other_user.friend_list
    // create new friend list, but use same _id
    const other_newlist = new Friends({
      list: other_list.list,
      pending: other_list.pending,
      request: other_list.request,
      _id: other_list._id,
    })
    // add "friend" to user friend list: pending
    user_newlist.pending.push(other_user._id)
    // add "user" to other's friend list: request
    other_newlist.request.push(req.user.user._id)

    // update both lists on database
    // !!! is this the proper way to do this?!
    const friend_list = await Friends.findByIdAndUpdate(req.user.user.friend_list, user_newlist, { new: true }).exec()
    const other_friend_list = await Friends.findByIdAndUpdate(other_user.friend_list, other_newlist, { new: true }).exec()
  
    res.json({ user: req.user.user, friend_list, other_friend_list })
  }
})
exports.friends_accept_request_post = asyncHandler(async(req, res, next) => {
  // get user's friend list
  const user_list = await Friends.findById(req.user.user.friend_list).exec()
  const user_newlist = new Friends({
    list: user_list.list,
    pending: user_list.pending,
    request: user_list.request,
    _id: user_list._id,
  })
  // is request in request array?
  // just to check and confirm that other user actually requested to be friends
  // not that the user figured out how to trick my backend...

  // need to create new amity user (somehow her friend_list was deleted, then can test this properly)
  // get other user's friend list
  const other_user = await User.findById(req.body.userid).exec()
  const other_list = await Friends.findById(other_user.friend_list).exec()
  const other_newlist = new Friends({
    list: other_list.list,
    pending: other_list.pending,
    request: other_list.request,
    _id: other_list._id,
  })

  // add friend to user list, remove from request list
  user_newlist.list.push(other_user._id.toString())
  user_newlist.request = user_list.request.filter(id => id != other_user._id)
  // add friend to other list, remove from pending list
  other_newlist.list.push(req.user.user._id)
  other_newlist.pending = other_list.pending.filter(id => id != req.user.user._id)
  // update both lists on the database
  const [userList, otherList] = await Promise.all([
    Friends.findByIdAndUpdate(req.user.user.friend_list, user_newlist, { new: true }).exec(),
    Friends.findByIdAndUpdate(other_user.friend_list, other_newlist, { new: true }).exec(),
  ]) 

  res.json({ user: req.user.user, userList, otherList })
})

exports.friends_deny_request_post = asyncHandler(async(req, res, next) => {
    // get user's friend list
    const user_list = await Friends.findById(req.user.user.friend_list).exec()
    const user_newlist = new Friends({
      list: user_list.list,
      pending: user_list.pending,
      request: user_list.request,
      _id: user_list._id,
    })
    // get other user's friend list
    const other_user = await User.findById(req.body.userid).exec()
    const other_list = await Friends.findById(other_user.friend_list).exec()
    const other_newlist = new Friends({
      list: other_list.list,
      pending: other_list.pending,
      request: other_list.request,
      _id: other_list._id,
    })
  
    // remove id from user's request list
    user_newlist.request = user_list.request.filter(id => id != other_user._id.toString())
    // remove id from other's pending list
    other_newlist.pending = other_list.pending.filter(id => id != req.user.user._id)
    // update both lists on the database
    const [userList, otherList] = await Promise.all([
      Friends.findByIdAndUpdate(req.user.user.friend_list, user_newlist, { new: true }).exec(),
      Friends.findByIdAndUpdate(other_user.friend_list, other_newlist, { new: true }).exec(),
    ]) 
  
    res.json({ user: req.user.user, userList, otherList })
})
exports.create_post = [
  body("title", "Post must have a title.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("content", "Post requires content.")
    .trim()
    .isLength({ min: 1 })
    .escape(), 

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req)

    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.user.user._id,
    })

    if (!errors.isEmpty()) {
      res.json({ errors })
    } else {
      await post.save()
      res.json({ user: req.user.user, post })
    }
  })
]
exports.delete_post = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.body.postid).exec()
  if (post === null) {
    const error = new Error("Post not found in database.")
    error.status = 404
    res.json({ errors: error })
  } else if (req.user.user._id != post.author) {
    const error = new Error("You aren't the creator of this post!")
    error.status = 403
    res.json({ errors: error })
  } else {
    await Post.findByIdAndDelete(req.body.postid)
    res.json({ message: "Successfully deleted post."})
  }
})
exports.like_post = asyncHandler(async (req, res, next) => {
  // query post, check likes array
  // if user already liked, don't allow
  // otherwise, add user id to likes array
  const post = await Post.findById(req.body.postid).exec()
  const likes = post.likes.filter(item => item.author == req.user.user._id)
  if (likes.length > 0) {
    const error = new Error("You already like this post...")
    error.status = 401
    res.json({ errors: error })
  } else {
    post.likes.push({ author: req.user.user._id })
    await post.save()
    res.json({ post })
  }
})
exports.unlike_post = asyncHandler(async (req, res, next) => {
  // query post, check likes array 
  // if user doesn't already like, don't allow
  // otherwise, remove user id from likes array
  const post = await Post.findById(req.body.postid).exec()
  const likes = post.likes.filter(item => item.author == req.user.user._id)
  if (likes.length == 0) {
    const error = new Error("You can't unlike a post you haven't liked to begin with!")
    error.status = 401
    res.json({ errors: error })
  } else {
    post.likes = post.likes.filter(item => item.author != req.user.user._id)
    await post.save()
    res.json({ post })
  }
})
exports.add_comment_post = [
  body("content", "Comment requires text.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req)

    const comment = {
      author: req.user.user._id,
      content: req.body.content,
    }
    if (!errors.isEmpty()) {
      res.json({ errors })
    } else {
      const post = await Post.findById(req.body.postid).exec()
      post.comments.push(comment)
      await post.save()
      res.json({ post })
    }
  })
]
exports.delete_comment_post = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.body.postid).exec()
  // would it be easiest to pass thru comment id in order to delete it specifically?
  const comment = post.comments.filter(item => item._id == req.body.commentid)
  if (comment.length == 0) {
    const error = new Error("Could not find comment in database.")
    error.status = 404
    res.json({ errors: error })
  } else if (comment[0].author != req.user.user._id) {
    const error = new Error("You are not the author of this comment.")
    error.status = 403
    res.json({ errors: error })
  } else {
    post.comments = post.comments.filter(item => item._id != req.body.commentid)
    await post.save()
    res.json({ post })
  }
})

  exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
      // need user to sign in to access page content
      const error = new Error("No token found.")
      error.status = 401
      return res.json({ errors: error })
    }
    jwt.verify(token, process.env.JWT_KEY, (err, user) => {
      if (err) {
        const error = new Error("You don't have proper clearance :/")
        error.status = 403
        return res.json({ errors: error })
      }
      req.user = user
      req.token = token
      next()
    })
  }
  exports.verifyNoToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token != null) {
      req.token = token // todo: is this best practice?
      // I put the token on the req.obj so that I'd be able to run a check on the login page (see fn above)
      // But I'm not sure that I even need this function at all...
      const error = new Error("You are already a user!")
      error.status = 403
      res.json({ errors: error, token })
    }
    next()
  }
