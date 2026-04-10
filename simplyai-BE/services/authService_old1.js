import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

class AuthService {

  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload, expiresIn = "24h") {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  static verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  // ==================== LOGIN ====================
  static async loginUser(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Query semplificata - senza email_verified
    const [users] = await pool.execute(
      `SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role, 
              p.subscription_plan, p.subscription_expiry, p.last_activity,
              a.password_hash 
       FROM profiles p 
       JOIN auth a ON p.id = a.user_id 
       WHERE p.email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = users[0];

    const isPasswordValid = await this.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Update last activity
    await pool.execute("UPDATE profiles SET last_activity = NOW() WHERE id = ?", [user.id]);

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          subscriptionPlan: user.subscription_plan,
          subscriptionExpiry: user.subscription_expiry,
          isAdmin: user.role === "administrator",
        },
        token,
      },
    };
  }

  // ... (tieni il resto delle funzioni come registerUser, getUserById, ecc.)
  // Puoi lasciare le altre funzioni così come sono
}

export default AuthService;
