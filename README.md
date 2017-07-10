# OpenCompare 2

[OpenCompare](https://github.com/OpenCompare/OpenCompare) from scratch in full js : mongoDB for the database, Node.js for the server and [VanillaJS](http://vanilla-js.com/) client-side for insane performances.

This project just started few days ago so lot of functionalities are coming soon.

## Installation
- First you need mongoDB :
  - [Install mongoDB on linux](https://docs.mongodb.com/manual/administration/install-on-linux/)
  - [Install mongoDB on OS X](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
  - [Install mongoDB on Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
- Then you need Node.js (npm is installed with Node.js) : [Download Node.js](https://nodejs.org/)
- Now clone this repository if not done yet and go inside with a console (for Windows use 'Node.js command prompt')
- Run `npm install`
- Finally be sure that mongoDB is started (if not go back to the install guide and check 'Start MongoDB') and run `node index.js`

Good Job can now open OpenCompare 2 in your browser at the adress [localhost:9009](localhost:9009)

## Import data

### From internet !
Hey the amazing feature is **here** :  
Copy paste any url in the search field on the homepage (ex: https://en.wikipedia.org/wiki/Eminem_discography) click on import, it will import every data matrices of the page.

### From old [Open Compare](http://37.59.124.84:9001/)
Open a pcm and copy the link of the pcm (ex: [https://opencompare.org/pcm/5757b9be975a3c01a5e5b477](https://opencompare.org/pcm/5757b9be975a3c01a5e5b477)) inside the search field on the homepage and click on import. You don't need to copy the full link, any string that contains the id of the pcm (ex: 5757b9be975a3c01a5e5b477) will work.

### From csv file
Drag and drop your file on the home page, a popup appears, click on import, done (separator has to be a comma).

## Create a new PCM
- Click on 'Create from scratch' on the home
- Fill the form (Only name is mandatory)
- Click on OK
- You can start editing your pcm by adding features and products (You has to be logged in)

## Features
This section is a draft, there are plenty of features, only those which need clarification are listed below.

### Editor
- **Multi-sort:** you can sort products using multiple features, a simple click add the feature to the list of features used to sort products, if the feature is already in the list it's reverse the order (for this feature only), double click to remove all other features.

- **Change cell type:** The input to edit a cell depends on the cell type, some types conversion are only available by clicking on the type of the cell :
  - all except date &rarr; multiple.
  - multiple or date &rarr; string.
  - to display the date input type the date followed by a `-` (ex: `2017-`) and press enter, the type will be detected as date.
