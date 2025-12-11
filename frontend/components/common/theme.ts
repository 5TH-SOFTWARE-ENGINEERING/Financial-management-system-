// theme.ts

export interface Theme {
  colors: {
    background: string;
    backgroundSecondary: string;
    primary: string;
    textSecondary: string;
    border: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  typography: {
    fontFamily: string;
    fontSizes: {
      sm: string;
      md: string;
      lg: string;
      xs: string;
      xxl: string;
    };
    fontWeights: {
      medium: number;
      bold: number;
    };
  };
  shadows: {
    md: string;
  };
  transitions: {
    default: string;
  };
}
export const theme: Theme = {
  colors: {
    background: "#fff",
    backgroundSecondary: "#f5f5f5",
    primary: "#00AA00",
    textSecondary: "#666",
    border: "#ddd",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "64px",
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSizes: {
      sm: "12px",
      md: "14px",
      lg: "18px",
      xs:"10px",
      xxl: "36px"
      
    },
    fontWeights: {
      medium: 500,
      bold: 700,
    },
  },
  shadows: {
    md: "0 4px 8px rgba(0,0,0,0.1)",
  },
  transitions: {
    default: "0.2s ease-in-out",
  },
};