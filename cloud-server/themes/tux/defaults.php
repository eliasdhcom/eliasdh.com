<?php

class OC_Theme {

        public function getBaseUrl() {
                return 'https://eliasdehondt.com';
        }

        public function getDocBaseUrl() {
                return 'https://eliasdehondt.com';
        }

        public function getTitle() {
                return 'Custom Cloud';
        }

        public function getName() {
                return 'Cloud Server';
        }

        public function getHTMLName() {
                return 'Cloud Server';
        }

        public function getEntity() {
                return 'Cloud Server Co.';
        }

        public function getSlogan() {
                return 'Your cloud server, personalized for you!';
        }

        public function getLogoClaim() {
                return '';
        }

        public function getShortFooter() {
                $footer = '© ' . date('Y') . ' <a href="' . $this->getBaseUrl() . '" target="_blank">' . $this->getEntity() . '</a>' .
                        '<br/>' . $this->getSlogan();

                return $footer;
        }

        public function getLongFooter() {
                $footer = '© ' . date('Y') . ' <a href="' . $this->getBaseUrl() . '" target="_blank">' . $this->getEntity() . '</a>' .
                        '<br/>' . $this->getSlogan();

                return $footer;
        }

        public function buildDocLinkToKey($key) {
                return $this->getDocBaseUrl() . '/server/15/go.php?to=' . $key;
        }


        public function getColorPrimary() {
                return '#aaa';
        }

        public function getScssVariables() {
                return [
                        'color-primary' => '#aaa'
                ];
        }
}
