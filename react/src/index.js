import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ApolloProvider } from "@apollo/client";
import { StyleSheetManager } from "styled-components";
import App from "./App";
import store from "./store";
import theme from "./theme";
import client from "./apolloClient";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ApolloProvider client={client}>
        <Provider store={store}>
          <Router>
            <ThemeProvider theme={theme}>
              <StyleSheetManager>
                <CssBaseline />
                <React.Suspense fallback={<div>Loading...</div>}>
                  <App />
                </React.Suspense>
              </StyleSheetManager>
            </ThemeProvider>
          </Router>
        </Provider>
      </ApolloProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").then(
      (registration) => {
        console.log("ServiceWorker registration successful with scope: ", registration.scope);
      },
      (err) => {
        console.log("ServiceWorker registration failed: ", err);
      }
    );
  });
}