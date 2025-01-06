const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    res.status(400).send("Missing Refresh Token");
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).send("Internal Server Error");
    return;
  }

  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (error: any, payload: any) => {
      if (error) {
        res.status(401).send("Invalid Refresh Token");
        return;
      }

      const userId = (payload as Payload)._id;

      try {
        const user = await User.findOne({ _id: userId });

        if (!user) {
          res.status(404).send("User not found");
          return;
        }

        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
          res.status(400).send("Invalid Refresh Token");
          user.refreshTokens = [];
          return;
        }

        user.refreshTokens = user.refreshTokens.filter(
          (token) => token !== refreshToken
        );

        await user.save();
        res.status(200).send("Logged out");
      } catch (error) {
        res.status(500).send(error);
      }
    }
  );
};

const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    res.status(400).send("Missing Refresh Token");
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).send("Internal Server Error");
    return;
  }

  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (error: any, payload: any) => {
      if (error) {
        res.status(401).send("Invalid Token");
        return;
      }

      const userId = (payload as Payload)._id;

      try {
        const user = await User.findOne({ _id: userId });

        if (!user) {
          res.status(404).send("User not found");
          return;
        }

        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
          user.refreshTokens = [];
          user.save();
          res.status(400).send("Invalid Token");
          return;
        }

        const tokens = generateToken(user._id);
        if (!tokens) {
          user.refreshTokens = [];
          await user.save();
          res.status(500).send("Internal Server Error");
          return;
        }

        user.refreshTokens = user.refreshTokens.filter(
          (token) => token !== refreshToken
        );

        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.status(200).send({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
      } catch (error) {
        res.status(500).send(error);
      }
    }
  );
};

export default {
  logout,
  refresh
};
