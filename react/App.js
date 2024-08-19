import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import store from "./store";

const Header = lazy(() => import("./components/Header"));
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Tweet = lazy(() => import("./components/Tweet"));

const App = () => {
    const [darkMode, setDarkMode] = useState(false);

    const theme = createTheme({
        palette: {
            mode: darkMode ? "dark" : "light",
        },
    });

    useEffect(() => {
        const savedMode = localStorage.getItem("darkMode");
        if (savedMode) {
            setDarkMode(JSON.parse(savedMode));
        }
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        localStorage.setItem("darkMode", JSON.stringify(!darkMode));
    };

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <Suspense fallback={<div>Loading...</div>}>
                        <Header toggleDarkMode={toggleDarkMode} />
                        <Switch>
                            <Route exact path="/" component={Home} />
                            <Route path="/profile/:id" component={Profile} />
                            <Route path="/auth" component={Auth} />
                            <Route path="/tweet/:id" component={Tweet} />
                        </Switch>
                    </Suspense>
                </Router>
            </ThemeProvider>
        </Provider>
    );
};

export default App;
