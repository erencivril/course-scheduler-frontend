import { createGlobalStyle } from "styled-components";
import { colors } from "./colors";

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400;600&display=swap');

  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    background: ${colors.white};
    color: ${colors.darkGray};
    font-family: 'Open Sans', Arial, sans-serif;
    font-size: 16px;
    box-sizing: border-box;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Montserrat', Arial, sans-serif;
    color: ${colors.orange};
    margin-top: 0;
  }

  a {
    color: ${colors.orange};
    text-decoration: none;
  }

  * {
    box-sizing: inherit;
  }

  button {
    font-family: 'Montserrat', Arial, sans-serif;
    font-weight: 700;
    background: ${colors.orange};
    color: ${colors.white};
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: ${colors.darkGray};
  }

  input, select, textarea {
    font-family: 'Open Sans', Arial, sans-serif;
    border: 1px solid ${colors.border};
    border-radius: 4px;
    padding: 8px;
    outline: none;
    transition: border 0.2s;
  }

  input:focus, select:focus, textarea:focus {
    border-color: ${colors.orange};
  }
`;
