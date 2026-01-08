// start-frontend.js
import { exec } from "child_process";

exec("npx serve -s dist -l 3000", (err, stdout, stderr) => {
  if (err) {
    console.error(`Erreur: ${err.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
});
