const express = require("express");
const errorHandler = require("../../middleware/error");
const User = require("../../models/user");
const { generateAuthToken } = require("../../utils/helpers");
const createUserSchema = require("./validationSchema");
const authHandler=require("../../middleware/auth");
const cookie = require('cookie');
const { FormateUserObj } = require("./UserFormatter");
const router = express.Router();
const {sendEmail}=require("./email")
// const {client}=require("./sendSMS")
const twilio = require('twilio');
const accountSid = 'AC924c9a60462ff8ef01fe7ab7cd72a0be';
const authToken = '4a4d15849fbbf4f07f1976345dbcc902';
const client = twilio(accountSid, authToken);

// create a get route

router.get(
  "/",
  errorHandler(async (req, res) => {
    if(req.headers.limit!==undefined){
      const limit=req.headers.limit;
      const skip=req.headers.skip;
      const users = await User.find().
      limit(limit).skip(skip).sort({ username: 1 })
    res.status(200).send(users);
    }else{
      const users = await User.find();
    res.status(200).send(users);
    }
    
  })
);

// create a get one by id route

router.get(
  "/viewProfile/:userId",
  errorHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.userId });
    const authToken = req.headers.authorization;
    if (authToken !== user.authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const UserObj = FormateUserObj(user);
    res.status(200).send({
      status: true,
      message: "user found successfully",
      data: UserObj,
    });
  })
);
router.put(
  "/editProfile/:userId",
  errorHandler(async (req, res) => {
    const user = await User.findOneAndUpdate({ _id: req.params.userId });

    const UserObj = FormateUserObj(user);
    res.status(200).send({
      status: true,
      message: "user found successfully",
      data: UserObj,
    });
  })
);
router.delete(
  "/deleteProfile/:userId",
  errorHandler(async (req, res) => {
    const user = await User.findOneAndDelete({ _id: req.params.userId });

    res.status(200).send(user);
  })
);

// create a login route

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).send({ message: "Invalid Email or Password" });
  }

  if (req.body.password !== user.password) {
    return res.status(400).send({ message: "Invalid Password" });
  }

  const token = generateAuthToken({
    username: user.username,
    email: user.email,
    id: user._id,
  });
  user.token=token
   await User.findOneAndUpdate({_id: user._id},{token:token})
  
  const data = {
    username: user.username,
    email: user.email,
    id: user._id,
  };
 
  // res.cookie('token', token, { httpOnly: true });
  const UserObj = FormateUserObj(user);
  res.status(200).send({
    status: true,
    message: "Login successfully",
    token,
    data: UserObj,
  });
});

// create a get signup route

router.post("/signup", async (req, res) => {
    const payload = req.body;
    const { error } = createUserSchema(payload);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }
  
   // payload.password = generateHash(payload.password);
   // console.log(payload)
    let user = new User(payload);
    const token = generateAuthToken({
      username: user.username,
      email: user.email
    });
    // payload.token = token
    user = await user.save();
    await User.findOneAndUpdate({ _id: user._id}, {token : token})
    const UserObj = FormateUserObj(user);
    //to send verification code
    sendEmail()
    res
      .status(200)
      .send({ status: true, message: "Signup successfully!", UserObj, token});


  });


router.post("/", async (req, res) => {
  const payload = req.body;
  const { error } = createUserSchema(payload);
  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }
  let user = new User(payload);

  user = await user.save();
  res.status(200).send({ user });
});
router.get(
  "/verifyUser",
  errorHandler(async (req, res) => {
    const user = await User.findOne({ token: req.query.token });
    await User.findOneAndUpdate({ _id: user._id }, { token: "" });
    res.status(200).send({
      status: true,
      message: "verify successfully",
    });
  })
);

router.post("/sendSMS", (req, res) => {
  const { to, body } = req.body;
  client.messages
    .create({
       body,
       from: +17262009836,
       to
     })
    .then(message => {
      console.log(message.sid);
      res.send('SMS sent');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send(error);
    });
    
});

// function generateToken() {
//   return uuid.v4();
// }

// router.get('/logout', authHandler,async (req, res) => {
//   // Clear the token from the client side
//   const user = await User.findOne({ token: req.headers.token });
//   await User.findOneAndUpdate({ _id: user._id }, { token: "" });
//   res.send('Logged out successfully');
// });
router.get(
  "/logout",
  authHandler,
  errorHandler(async (req, res) => {
    const user = await User.findOne({ token: req.headers.token });
    await User.findOneAndUpdate({ _id: user._id }, { token: "" });
    res.status(200).send({
      status: true,
      message: "Logout successfully",
    });
  })
);


module.exports = router;
