import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import { ApolloProvider } from "@apollo/client";
import styled from "styled-components";
import store from "./store";
import client from "./apolloClient";
import ErrorBoundary from "./components/ErrorBoundary";
import SkeletonLoader from "./components/SkeletonLoader";

const Header = lazy(() => import("./components/Header"));
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Tweet = lazy(() => import("./components/Tweet"));
const Search = lazy(() => import("./pages/Search"));
const TrendingTopics = lazy(() => import("./components/TrendingTopics"));
const Notifications = lazy(() => import("./components/Notifications"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Lists = lazy(() => import("./pages/Lists"));
const Settings = lazy(() => import("./pages/Settings"));

const AppContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
`;

const ContentContainer = styled.div`
    display: flex;
    flex: 1;
`;

const MainContent = styled.main`
    flex: 1;
    padding: 20px;
`;

const SidebarRight = styled.aside`
    width: 300px;
    padding: 20px;
`;

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
        <ApolloProvider client={client}>
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Router>
                        <ErrorBoundary>
                            <AppContainer>
                                <Suspense fallback={<SkeletonLoader />}>
                                    <Header toggleDarkMode={toggleDarkMode} />
                                    <ContentContainer>
                                        <MainContent>
                                            <Switch>
                                                <Route exact path="/" component={Home} />
                                                <Route path="/profile/:id" component={Profile} />
                                                <Route path="/auth" component={Auth} />
                                                <Route path="/tweet/:id" component={Tweet} />
                                                <Route path="/search" component={Search} />
                                                <Route path="/bookmarks" component={Bookmarks} />
                                                <Route path="/lists" component={Lists} />
                                                <Route path="/settings" component={Settings} />
                                            </Switch>
                                        </MainContent>
                                        <SidebarRight>
                                            <TrendingTopics />
                                            <Notifications />
                                        </SidebarRight>
                                    </ContentContainer>
                                </Suspense>
                            </AppContainer>
                        </ErrorBoundary>
                    </Router>
                </ThemeProvider>
            </Provider>
        </ApolloProvider>
    );
};

export default App;
