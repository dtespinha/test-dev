import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = await getNumberOfRounds();
  return await bcryptjs.hash(password, rounds);
}

async function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
