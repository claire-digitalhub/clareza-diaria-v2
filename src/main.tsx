import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// FIX BUG 8: StrictMode ativado — detecta side effects incorretos em dev
// (foi o que deixou o Bug 2 passar: useState usado como useEffect)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
