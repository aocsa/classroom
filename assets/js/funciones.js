//-------------------ALUMNO--------

// PARSE YA ESTA INICIALIZADO EN POLY-PROFILE

//Guardamos nueva tarea
function saveHomework(expense){
    var TableExpense = Parse.Object.extend("Homework");
    var tableExpenseData = new TableExpense();

    //Activamos el spinner para dar la sensación de carga o estado en proceso
    $('#spinnerSave').prop("active",true);
    $( "#saveButton" ).prop( "disabled", true );

    tableExpenseData.set("title", expense.titulo);
    tableExpenseData.set("deadline", expense.deadline);
    tableExpenseData.set("description", expense.descripcion);
    tableExpenseData.set("status", "nuevo");
    var User_ = Parse.Object.extend("User");
    var myuser = new User_();
    myuser.id = sessionStorage.getItem('id');
    tableExpenseData.set("homework_user", myuser);

    //Guardar archivo/imagen en Parse
    if (expense._attachments && expense._attachments.receipt) {
        var name = "nameimg.jpg";
        var file = new File([expense._attachments.receipt.data],name);
        var parseFile = prepareSaveFile(file,name);
        tableExpenseData.set("attachment", parseFile);
    }

    tableExpenseData.save(null, {
        success: function(tableExpense) {
            // Execute any logic that should take place after the object is saved.
            app.$.toast.text ='New Homework created!!';
            app.$.toast.show();

            //School_User esta en sessionStorage.getItem('school')
            //Sacaremos todos los usuarios que sean profesores y que tengan la misma escuela que el usuario_current
            //var TableUser = Parse.Object.extend("User");
            var query = new Parse.Query(User_);
            query.equalTo("user_type", 'Profesor');
            query.equalTo("school", sessionStorage.getItem('school'));
            query.find({
                success: function(results) {
                    console.log("Successfully retrieved " + results.length + " scores.");
                    //SAVE TABLE Message
                    var user_sender = new User_();
                    user_sender.id = sessionStorage.getItem('id');
                    for (var i = 0; i < results.length; i++) {
                        var object = results[i];
                        var user_receiver = new User_();
                        user_receiver.id = object.id;

                        saveTableMessage(user_sender,user_receiver,0,tableExpenseData,'null');
                    }
                },
                error: function(error) {
                    console.log("Error: " + error.code + " " + error.message);
                }
            });
        },
        error: function(tableExpense, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            app.$.toast.text ='ERROR to create hoemwork!!';
            app.$.toast.show();
            console.log('Failed to create new object, with error code: ' + error.message);
        }
    });
}

function prepareSaveFile(file,name){
    var parseFile = new Parse.File(name, file);
    parseFile.save().then(function() {
        // The file has been saved to Parse.
    }, function(error) {
        // The file either could not be read, or could not be saved to Parse.
        console.log('error parseFile');
    });
    return parseFile;
}

function sendFirstMessage (userSender, userReceiver, homework) {
   var pubnub = new PubNub({ publishKey : 'pub-c-467437f5-5346-4f8c-9ddf-2de1c90a93c8', subscribeKey : 'sub-c-52679430-efef-11e6-b753-0619f8945a4f' });
   var mycolor = 'navy';
   var mycat = 'mess';
   var   myuuid = mycat + '-' + mycolor;
   var    myavatar = 'images/' + 'navy' + '.jpg';
   var   mychannel = homework.id + '-' + userSender.id + '-' + userReceiver.id;
    pubnub.publish(  {
     message: {
         uuid: myuuid,
         username : userSender.name,
         avatar: myavatar,
         color: mycolor,
         text: '',
         timestamp: new Date().toISOString(),
         meta:   homework
     },
     channel:  mychannel
   });
}

function saveTableMessage(userSender,userReceiver,cost,PointHomework,PointPayment){

    sendFirstMessage (userSender, userReceiver, PointHomework);

    var TableMessage = Parse.Object.extend("Message");
    var tableMessage = new TableMessage();
    tableMessage.set("sender", userSender);
    tableMessage.set("receiver", userReceiver);
    tableMessage.set("cost", cost);
    tableMessage.set("homework", PointHomework);
    if(PointPayment!='null'){
        tableMessage.set("payment", PointPayment);
    }

    tableMessage.save(null, {
        success: function(tableMessage) {
            console.log('New tableMessage created with objectId: ' + tableMessage.id);
                //if (results.length  == i) { // last message
                    if(PointPayment=='null'){//funcion saveHomework
                        dialog.close();
                        page('/');
                        pubnub.publish({
                            channel: 'chatChannel',//channel: PointHomework.id + '-' + userReceiver.id
                            message: { foo : 'update-list',sender: userSender.id , school: userReceiver.get("school")}
                        }, function ( status, response ) {
                            console.log( status.error, response );
                        });
                    }else{//esta es la funcion de savePayment
                        dialogpay.close();
                        page('/received');

                        pubnub.publish({
                            channel: 'chatChannel',
                            message: {foo: 'update-statusProgress', sender_id: sessionStorage.getItem('id'), receiver_id: user_receiver.id }
                        },function(status, response){
                            console.log(status.error, response);
                        });
                    }
                //}
        },
        error: function(tableMessage, error) {
            console.log("Error: " + error.code + " " + error.message);
        }
    });
}

function savePayment(expense){
    //Activamos el spinner para dar la sensación de carga o estado en proceso
    $('#spinnerSave').prop("active",true);
    $( "#saveButton" ).prop( "disabled", true );

    // PARSE YA ESTA INICIALIZADO EN POLY-PROFILE
    var UserClass = Parse.Object.extend("User");
    var user_sender = new UserClass();
    user_sender.id = sessionStorage.getItem('id');

    var user_receiver = new UserClass();

    var combobox =  document.querySelector('#elements-box');
    user_receiver.id =     combobox.selectedItem.sender_user_id;

    var PaymentClass = Parse.Object.extend("Payment");
    var paymentObj = new PaymentClass();
    var codeTransaction = $('#transaction').val();
    paymentObj.set('code',codeTransaction);
    //Guardar archivo/imagen en Parse
    if (expense._attachments && expense._attachments.receipt) {
        var name = "nameimg.jpg";
        var file = new File([expense._attachments.receipt.data],name);

        var parseFile = prepareSaveFile(file,name);
        paymentObj.set("attachment", parseFile);
    }

    var HomeworkClass = Parse.Object.extend("Homework");
    var homework = new HomeworkClass();
    homework.id = expense._id;
    homework.set('status','en progreso');

    saveTableMessage(user_sender,user_receiver,expense.total,homework,paymentObj);

    app.$.toast.text = 'New object created with objectId: ';
    app.$.toast.show();
}
