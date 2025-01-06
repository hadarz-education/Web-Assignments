import appInit from "./server";
const port = process.env.PORT || 3000;

const tempFunction = async () => {
  const app = await appInit();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

tempFunction();
