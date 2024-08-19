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

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
        <ApolloProvider client={client}>
            <Provider store={store}>
                <Router>
                    <ThemeProvider theme={theme}>
                        <StyleSheetManager>
                            <CssBaseline />
                            <App />
                        </StyleSheetManager>
                    </ThemeProvider>
                </Router>
            </Provider>
        </ApolloProvider>
    </React.StrictMode>
);
