import * as React from "react";

export const ThemeContext = React.createContext({
  theme: "dark"
});

export function ThemeProvider({ children }) {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}
