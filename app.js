const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4005, () => {
      console.log("Server Running at http://localhost:4005/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//api1

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      //checking the length of the password
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
        INSERT INTO
            user (username, name, password, gender, location)
        VALUES
            (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'  
            );`;
      await db.run(createUserQuery);
      response.send(`User created successfully`);
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
        SELECT 
            * 
        FROM 
            user 
        WHERE 
            username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send(`Invalid user`);
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
        SELECT 
            * 
        FROM 
            user 
        WHERE 
            username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched === true) {
    if (newPassword.length < 5) {
      //checking the length of the password
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePassword = `UPDATE user SET password='${hashedNewPassword}' where username='${username}';`;
      await db.run(updatePassword);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
