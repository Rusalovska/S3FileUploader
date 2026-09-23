import express from "express";
import { authenticate } from "./middleware/authenticate";
import { errorHandler } from "./middleware/error-handler";
import { tokenService } from "../services";

export const app = express();

app.use(express.json());
app.use(authenticate(tokenService));

app.use(errorHandler);    