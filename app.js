const express = require("express");
const app = express();

app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const bcrypt = require("bcrypt");

const path = require("path");
const dbpath = path.join(__dirname, "userData.db");

let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("the server running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`The DB error is:${e.message}`);
  }
};

initializeDB();

const ValidatePassword = (password) => {
  return password.length < 5;
};

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  const passwordEncrption = await bcrypt.hash(password, 10);

  const Check_User = `SELECT * FROM user WHERE username='${username}';`;
  let dbCheck = await db.get(Check_User);

  if (dbCheck === undefined) {
    const User_register = `INSERT INTO user
        VALUES('${username}', '${name}', '${passwordEncrption}', '${gender}', '${location}');`;

    if (ValidatePassword(password)) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(User_register);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  let { username, name, password, gender, location } = request.body;

  const Check_user_login = `SELECT * FROM user WHERE username='${username}';`;

  let check = await db.get(Check_user_login);

  if (check === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let checkPassword = await bcrypt.compare(password, check.password);
    if (checkPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;

  const check_User = `SELECT * FROM user WHERE username='${username}';`;

  let User_db = await db.get(check_User);

  let comparePassword = await bcrypt.compare(oldPassword, User_db.password);

  if (User_db === undefined) {
    response.status(400);
    response.send("Invalid user");
  }
  if (comparePassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedPassword = await bcrypt.hash(newPassword, 10);
      const update_User_Password = `UPDATE user SET password='${hashedPassword}' WHERE username='${username}';`;

      await db.run(update_User_Password);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
