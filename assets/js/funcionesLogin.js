//Funciones para el Login

function InitAPIFacebookWeb(){
    // Load the SDK asynchronously
    var app_Id= '1762597997362966';
    window.fbAsyncInit = function() {
        // FB JavaScript SDK configuration and setup
        FB.init({
            appId      : app_Id, // FB App ID
            status     : true,  // check Facebook Login status
            cookie     : true,  // enable cookies to allow the server to access the session
            xfbml      : true,  // parse social plugins on this page
            version    : 'v2.8' // use graph api version 2.8
        });
    };

    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
}

function loginWebFacebook(){
    FB.login(function (response) {
        if (response.authResponse) {
            // Get and display the user profile data
            saveUserFacebook();
        } else {
            alert("User cancelled the Facebook login or did not fully authorize.");
        }
    }, {scope: 'email'});
}

function saveUserFacebook(){
    //web
    FB.api('/me', {locale: 'en_US', fields: 'id,first_name,last_name,email,link,gender,locale,picture'},
    function (response) {
        //alert('<p><b>FB ID:</b> '+response.id+'</p><p><b>Name:</b> '+response.first_name+' '+response.last_name+'</p><p><b>Email:</b> '+response.email+'</p><p><b>Gender:</b> '+response.gender+'</p><p><b>Locale:</b> '+response.locale+'</p><p><b>Picture:</b> <img src="'+response.picture.data.url+'"/></p><p><b>FB Profile:</b> <a target="_blank" href="'+response.link+'">click to view profile</a></p>');
        //name: response.first_name + ' ' + response.last_name
        //username: response.id
        //email: response.email
        //user_type: Estudiante
        //school: ??
        Parse.User.logIn(response.id, 'passwordFB:'+ response.id, {
            success: function(results) {
                UserFacebook(results);
            },
            error: function (user, error) {
                // The login failed. Check error to see why.
                registrarUserFacebook(response);
                log.console("Error: " + error.code + " " + error.message);
            }
        });
    });
}

//si el usuario si esta en la base de datos
function UserFacebook(res){
    console.log("is userFabeook");
    sessionStorage.setItem('id', res.id);
    sessionStorage.setItem('user_type', res.attributes.user_type);
    sessionStorage.setItem('school', res.attributes.school);
    sessionStorage.setItem('username', res.attributes.name);
    sessionStorage.setItem('token', res.getSessionToken());
    window.location = '/';
}
//si el usuario no esta en la base de datos
function registrarUserFacebook(response){
    console.log("register userFabeook");
    var newuser = new Parse.User();
    newuser.set("name", response.first_name + ' ' + response.last_name);
    newuser.set("email", response.email);
    newuser.set("username", response.id);
    newuser.set("password", 'passwordFB:'+ response.id);
    newuser.set("school", 'null');
    newuser.set("user_type", "Estudiante");

    newuser.signUp(null, {
        success: function (res) {
            UserFacebook(res);
        },
        error: function (user, error) {
            // Show the error message somewhere and let the user try again.
            log.console("Error: " + error.code + " " + error.message);
        }
    });

}

function logout(){
    sessionStorage.removeItem('id');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('school');
    sessionStorage.removeItem('user_type');
    sessionStorage.removeItem('username');

    /*FB.logout(function(response) {
    // user is now logged out
    });*/
    FB.getLoginStatus(function(response) {
        if (response && response.status === 'connected') {
            FB.logout(function(response) {
                // user is now logged out
            });
        }
    });
}