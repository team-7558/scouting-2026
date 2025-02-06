import express from "express";
import jwt from "jsonwebtoken";
import { authenticateUser, createUser } from "../database/auth.js";

const router = express.Router();

export default router;
