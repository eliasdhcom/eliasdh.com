<?php

require_once __DIR__ . '/lib/versioncheck.php';

try {
	require_once __DIR__ . '/lib/base.php';

	OC::handleRequest();
} catch (\OC\ServiceUnavailableException $ex) {
	\OC::$server->getLogger()->logException($ex, ['app' => 'index']);

	OC_Template::printExceptionErrorPage($ex, 503);
} catch (\OC\HintException $ex) {
	try {
		OC_Template::printErrorPage($ex->getMessage(), $ex->getHint(), 503);
	} catch (Exception $ex2) {
		try {
			\OC::$server->getLogger()->logException($ex, ['app' => 'index']);
			\OC::$server->getLogger()->logException($ex2, ['app' => 'index']);
		} catch (Throwable $e) {

		}

		OC_Template::printExceptionErrorPage($ex, 500);
	}
} catch (\OC\User\LoginException $ex) {
	OC_Template::printErrorPage($ex->getMessage(), $ex->getMessage(), 403);
} catch (Exception $ex) {
	\OC::$server->getLogger()->logException($ex, ['app' => 'index']);

	OC_Template::printExceptionErrorPage($ex, 500);
} catch (Error $ex) {
	try {
		\OC::$server->getLogger()->logException($ex, ['app' => 'index']);
	} catch (Error $e) {
		http_response_code(500);
		header('Content-Type: text/plain; charset=utf-8');
		print("Internal Server Error\n\n");
		print("The server encountered an internal error and was unable to complete your request.\n");
		print("Please contact the server administrator if this error reappears multiple times, please include the technical details below in your report.\n");
		print("More details can be found in the webserver log.\n");

		throw $ex;
	}
	OC_Template::printExceptionErrorPage($ex, 500);
}
