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

/***/ "./src/background/index.ts":
/*!*********************************!*\
  !*** ./src/background/index.ts ***!
  \*********************************/
/***/ (() => {

eval("\n\n// Background script\n// Service worker for Manifest V3\n// Example: Listen for installation\nchrome.runtime.onInstalled.addListener(function () {\n  console.log('Extension installed');\n  // Initialize storage with default values\n  chrome.storage.local.set({\n    count: 0,\n    settings: {\n      enabled: true,\n      theme: 'light',\n      refreshInterval: 60,\n      notifications: true\n    }\n  }, function () {\n    console.log('Storage initialized with default values');\n  });\n});\n// Example: Listen for messages from content scripts or popup\nchrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {\n  console.log('Message received:', message);\n  if (message.type === 'GET_COUNT') {\n    chrome.storage.local.get(['count'], function (result) {\n      sendResponse({\n        count: result.count || 0\n      });\n    });\n    return true; // Required for async sendResponse\n  }\n  if (message.type === 'POPUP_OPENED') {\n    sendResponse({\n      success: true,\n      message: 'Background script received popup opened message'\n    });\n  }\n  if (message.type === 'CONTENT_LOADED') {\n    sendResponse({\n      success: true,\n      message: 'Background script received content loaded message'\n    });\n  }\n});\n\n//# sourceURL=webpack://split-search/./src/background/index.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/background/index.ts"]();
/******/ 	
/******/ })()
;