app_recrutement_client
======================


client pour l'application app_recrutement


Installation 
------------


L'installation des composants utilise bower.

Installer les prérequis pour Ubuntu 14.04

```
    sudo apt-get install nodejs npm
    sudo npm install -g bower
```


Installation de l'application

```
    git clone https://github.com/PnCevennes/app_recrutement_client.git
    cd app_recrutement_client
    bower install
    ln -s $($pwd) /chemin/vers/app_recrutement/static
```

Url de test de l'application : http://127.0.0.1:5000/static/app.htm
