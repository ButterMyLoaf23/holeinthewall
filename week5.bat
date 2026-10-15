curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week05/firestore.rules
if not exist public mkdir public
cd public
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week05/config.js
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week05/projects.html
if not exist styles mkdir styles
cd styles
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week05/styles.css
cd ..
cd ..
dir
:: if the .bat file is left, firebase might not deploy
del week5.bat
