const UserModel = require("../models/user");
const CourseModel = require("../models/course");
const bcrypt = require("bcrypt");
const e = require("connect-flash");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");

// Configuration
cloudinary.config({
  cloud_name: "dclltwlph",
  api_key: "343467267116581",
  api_secret: "Lsbg3k9_0-AdITWFQvcmMG5Ti9Y", // Click 'View API Keys' above to copy your API secret
});

class FrontController {
  static home = async (req, res) => {
    try {
      const { name, image, email, id, role } = req.userData;
      const btech = await CourseModel.findOne({ user_id: id, course: "btech" });
      const bca = await CourseModel.findOne({ user_id: id, course: "bca" });
      const mca = await CourseModel.findOne({ user_id: id, course: "mca" });
      //console.log(btech)
      res.render("home", {
        n: name,
        e: email,
        i: image,
        btech: btech,
        bca: bca,
        mca: mca,
        r: role,
      });
      //console.log(name)
    } catch (error) {
      console.log(error);
    }
  };
  static about = async (req, res) => {
    try {
      const { name, image } = req.userData;
      res.render("about", {
        n: name,
        i: image,
      });
    } catch (error) {
      console.log(error);
    }
  };
  static login = async (req, res) => {
    try {
      res.render("login", {
        msg: req.flash("success"),
        msg1: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
    }
  };
  static register = async (req, res) => {
    try {
      res.render("register", { message: req.flash("error") });
    } catch (error) {
      console.log(error);
    }
  };
  static contact = async (req, res) => {
    try {
      const { name, image } = req.userData;
      res.render("contact", {
        n: name,
        i: image,
      });
    } catch (error) {
      console.log(error);
    }
  };
  static userInsert = async (req, res) => {
    try {
      //console.log(req.files);
      // const file = req.files.image;
      // const imageUpload = await cloudinary.uploader.upload(file.tempFilePath, {
      //   folder: "profile"
      // });
      //console.log(imageUpload)
      const { n, e, p, cp } = req.body;

      const user = await UserModel.findOne({ email: e });
      if (user) {
        req.flash("error", "Email already exists");
        res.redirect("/register");
      } else {
        if (n && e && p && cp) {
          if (p == cp) {
            const file = req.files.image;
            const imageUpload = await cloudinary.uploader.upload(
              file.tempFilePath,
              {
                folder: "profile",
              }
            );
            const hashPassword = await bcrypt.hash(p, 10);
            const result = new UserModel({
              name: n,
              email: e,
              password: hashPassword,
              image: {
                public_id: imageUpload.public_id,
                url: imageUpload.secure_url,
              },
            });

            await result.save();
            req.flash("success", "successfully registered");
            res.redirect("/"); //route ka url h
          } else {
            req.flash("error", "Password not matched");
          }
        } else {
          req.flash("error", "All fields are required");
          res.redirect("/register");
        }
      }
      // const result = new UserModel({
      //   name:n,
      //   email:e,
      //   password:p,
      //   image:{
      //     public_id:imageUpload.public_id,
      //     url:imageUpload.secure_url
      //   }
      // })
      // await result.save()
      // res.redirect('/')//route ka url h
    } catch (error) {
      console.log(error);
    }
  };
  static verifylogin = async (req, res) => {
    try {
      //console.log(req.body)
      const { email, password } = req.body;
      const user = await UserModel.findOne({ email: email });
      if (user != null) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          if (user.role == "admin") {
            //token
            var token = jwt.sign({ ID: user._id }, "babaabababababbabab");
            //console.log(token);
            res.cookie("token", token);
            //admin login
            res.redirect("/admin/dashboard");
          }
          if (user.role == "user") {
            //token
            var token = jwt.sign({ ID: user._id }, "babaabababababbabab");
            //console.log(token);
            res.cookie("token", token);
            //admin login
            res.redirect("/home");
          }
        } else {
          req.flash("error", "Email or Password is not valid");
          res.redirect("/");
        }
      } else {
        req.flash("error", "User not found");
        res.redirect("/");
      }
    } catch (error) {
      console.log(error);
    }
  };
  static changePassword = async (req, res) => {
    try {
      const { id } = req.userData;
      const { op, np, cp } = req.body;
      if (op && np && cp) {
        const user = await UserModel.findById(id);
        const isMatched = await bcrypt.compare(op, user.password);
        //console.log(isMatched)
        if (!isMatched) {
          req.flash("error", "Current password is incorrect");
          res.redirect("/profile");
        } else {
          if (np != cp) {
            req.flash("error", "password doesn't match");
            res.redirect("/profile");
          } else {
            const newHashPassword = await bcrypt.hash(np, 10);
            await UserModel.findByIdAndUpdate(id, {
              password: newHashPassword,
            });
            req.flash("success", "password updated successfully");
            res.redirect("/");
          }
        }
      } else {
        req.flash("error", "All fields are required");
        res.redirect("/profile");
      }
    } catch (error) {
      console.log(error);
    }
  };
  static logout = async (req, res) => {
    try {
      res.clearCookie("token");
      res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  };
  static profile = async (req, res) => {
    try {
      const { name, image, email } = req.userData;
      res.render("profile", {
        n: name,
        i: image,
        e: email,
      });
    } catch (error) {
      console.log(error);
    }
  };

  static updateProfile = async (req, res) => {
    try {
      const { name, email } = req.body;
      const { id } = req.userData;

      // Find the user from the database
      const user = await UserModel.findById(id);

      // Create a data object to store updated fields
      let data = { name, email };

      if (req.files) {
        const imageID = user.image.public_id;
        //console.log(imageID);

        // Destroying the previous image
        await cloudinary.uploader.destroy(imageID);

        // New image upload
        const imagefile = req.files.image;
        const imageUpload = await cloudinary.uploader.upload(
          imagefile.tempFilePath,
          {
            folder: "userprofile",
          }
        );

        // Adding image data to the update object
        data.image = {
          public_id: imageUpload.public_id,
          url: imageUpload.secure_url,
        };
      }

      // Update user details in the database
      await UserModel.findByIdAndUpdate(id, data);
      res.redirect("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  // static updateProfile = async (req, res) => {
  //   try {
  //     const {name,email,image} = req.body;
  //     const {id} = req.userData;
  //     if (req.files) {
  //       const user = await UserModel.findById(id);
  //       const imageID = user.image.public_id;
  //       console.log(imageID);
  //       //destroying previous image
  //       await cloudinary.uploader.destroy(image);
  //       //new image upload
  //       const imagefile = req.files.image;
  //       const imageUpload = await cloudinary.uploader.upload(
  //         imagefile.tempFilePath,
  //         {
  //           folder : "userprofile",
  //         }
  //       );
  //       var data = {
  //         name:name,
  //         email:email,
  //         image:{
  //           public_id:imageUpload.public_id,
  //           url:imageUpload.secure_url
  //         }
  //       }
  //     } else {

  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
}
module.exports = FrontController;
