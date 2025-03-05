/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/content/index.ts":
/*!******************************!*\
  !*** ./src/content/index.ts ***!
  \******************************/
/***/ (() => {

eval("\n\n// Content script\n// This script runs on web pages that match the pattern in manifest.json\nconsole.log('Content script loaded');\n// Example: Modify page content\nfunction modifyPage() {\n  // Your code here\n  console.log('Content script is running on: ' + window.location.href);\n}\n// Example: Send a message to the background script\nfunction sendMessageToBackground() {\n  chrome.runtime.sendMessage({\n    type: 'CONTENT_LOADED',\n    url: window.location.href\n  }, function (response) {\n    console.log('Response from background:', response);\n  });\n}\n// Run when the page is fully loaded\ndocument.addEventListener('DOMContentLoaded', function () {\n  modifyPage();\n  sendMessageToBackground();\n});\n\n//# sourceURL=webpack://split-search/./src/content/index.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/content/index.ts"]();
/******/ 	
/******/ })()
;