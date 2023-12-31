import {
  findUserByEmail,
  createUser,
} from "../repositories/auth.repository.js";
// import pkg from "jsonwebtoken";
// const { sign } = pkg;
import { hash, compare } from "bcrypt";
const saltRounds = 10;
import "dotenv/config";
import { generateAccessToken, generateRefreshToken } from "../Token/tokens.js";
import { refToken } from "./refreshToken.service.js";

export const passwordValidate = (pass) => {
  // Password regex validation
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{5,}$/;
  return passwordRegex.test(pass);
};



export const signUp = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email + " in service layer " + req.body);
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log("User already")
      return res.status(409).json({
        message: "Email already exists. Please use a different email.",
      });
    }

    if (!passwordValidate(password)) {
      return res.status(403).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      });
    }

    const hashedPassword = await hash(password, saltRounds);

    const newUser = {
      email,
      password: hashedPassword,
    };
    await createUser(newUser);
    //generating acces Token for authentication

   const accessToken = generateAccessToken(newUser)
   const refreshToken = generateRefreshToken(newUser)


  const user = await findUserByEmail(newUser.email)
 
     if( user ){
       console.log("In if statement")
       refToken(user._id, refreshToken)
     }else{
       return res.json({"error":"refresh token not found"})
     }

    return res.json({ email, accessToken, refreshToken });
  } catch (error) {
    // Add specific error message or logging here
    console.log(error + " in service layer");
    return res
      .status(500)
      .json({ message: "Error signing up.", error: error.message });
  }
};

// retrieve access token by using the refresh token
// export const retrieveAccessToken = () => {

// }

export const login = async (req, res) => {
  // res.json({"message": "i am in loggin service layer"});
  const { email, password } = req.body;

  const query = await findUserByEmail(email);
  if (!query) {
    return res.json("email not found");
  } else {
    if (query) {
      console.log(query.password);
      const matchPassword = await compare(password, query.password);

      if (matchPassword) {
        return res.json("email & password match");
      } else {
        return res.json("password not matched");
      }
    }
  }
};
