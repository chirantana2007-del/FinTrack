const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const [existingUsers] = await pool.execute(
      "SELECT user_id FROM Users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    let userId;
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        "INSERT INTO Users (full_name, email, password_hash) VALUES (?, ?, ?)",
        [name, email, passwordHash]
      );
      userId = result.insertId;

      await connection.execute(
        "INSERT INTO UserSettings (user_id) VALUES (?)",
        [userId]
      );

      // The frontend has no accounts UI/picker; give every new user one
      // default account so the upload flow always has somewhere to attach
      // transactions to without asking them to set one up first.
      await connection.execute(
        "INSERT INTO Accounts (user_id, account_name, account_type, currency_code) VALUES (?, 'Primary Account', 'bank', 'INR')",
        [userId]
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: userId,
        name,
        email
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const [users] = await pool.execute(
      "SELECT * FROM Users WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  register,
  login
};
