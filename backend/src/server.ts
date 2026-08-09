import { app } from "@/app";
import { env } from "@/config/env";

app.listen(env.port, () => {
  console.log(`Gym app backend listening on http://localhost:${env.port}`);
});
