curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week06/firestore.rules
if not exist public mkdir public
cd public
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week06/cr.html
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week06/crd.html
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week06/crud.html
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week06/favicon.ico
curl --ssl-no-revoke -O https://byui-cloud.github.io/itm101-course/week06/logo.png
cd ..
dir
:: if the .bat file is left, firebase might not deploy

del week6.bat
