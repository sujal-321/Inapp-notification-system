import * as React from "react";

export const ThemeContext = React.createContext({
  theme: "dark",
  setTheme: () => null
});

export function ThemeProvider({ children }) {
  const [theme] = React.useState("dark"); // 🔥 force dark

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}
