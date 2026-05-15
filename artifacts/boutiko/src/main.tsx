import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getAuthToken } from "./lib/auth";
import { LanguageProvider } from "./i18n";
import App from "./App";
import "./index.css";

setAuthTokenGetter(getAuthToken);

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
