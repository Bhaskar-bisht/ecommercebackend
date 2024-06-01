const express = require("express");
const path = require("path");
// const User = require("../model/user");
const router = express.Router();
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandling");
const fs = require("fs");
const jwt = require("jsonwebtoken");
// const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");
const sendMail = require("../utils/sendmail");
const User = require("../models/user");

// -----------------------------------------------------------------------------------------------

router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      // If user already exists, delete the uploaded file
      // const filename = req.file.filename;
      // const filePath = `uploads/${filename}`;
      // fs.unlink(filePath, (err) => {
      //   if (err) {
      //     console.log(err);
      //     res.status(500).json({ message: "Error deleting File" });
      //   }
      // });
      return next(new ErrorHandler("User Already Exists", 400));
    }

    // Construct fileUrl using the uploaded file's filename
    // const filename = req.file.filename;
    // const fileUrl = path.join(filename);

    // Create the user object
    const user = {
      name: name,
      email: email,
      password: password,
      // avatar: {
      //   public_id: "public_id_value", // Replace with the actual public_id value
      //   url: fileUrl,
      // },
    };

    // Save the user to the database

    const activationToken = createActivationToken(user);
    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Activate Your Account",
        message: `Hello ${user.name} , please Click on the Link to Activate Your Account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email :- ${user.email} to activate your account..!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    // Handle any errors that occur during user creation
    return next(new ErrorHandler(error.message, 400));
  }
});

// const create activationToken

const createActivationToken = (user) => {
  return jwt.sign(user, 'PWj0fI#&DsZY9w$8tHe11*yr9F45K*j2xj&fceGZ!tEnMNZcEN', {
    expiresIn: "5m",
  });
};

// activate our user

router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        'PWj0fI#&DsZY9w$8tHe11*yr9F45K*j2xj&fceGZ!tEnMNZcEN'
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }

      const { name, email, password, avatar } = newUser;

      let user = await user.findOne({ email });

      if (user) {
        return next(new ErrorHandler("user already exits", 400));
      }

      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(newUser, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login user

router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please Provide The All Field.!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exist.!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please Provide a Valid Email Or Password", 400)
        );
      }
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exist.!", 400));
      }
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// logout user

router.get("/logout", isAuthenticated ,catchAsyncErrors(async (req, res, next) => {
  try {
    
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true
    })

    res.status(201).json({
      success: true,
      message: "User logout Successful..!"
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}))

module.exports = router;
