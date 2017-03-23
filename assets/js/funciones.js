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
        var parseFile = prepareSaveFile(expense._attachments.receipt);
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

                        saveTableMessage(user_sender,user_receiver,-1,tableExpenseData,'null');//costo es -1 cuando la tarea es nueva
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

function prepareSaveFile(receipt){
    var name = receipt.name;
    var file = receipt.data;
    if(isFileImage){
        file = new File([receipt.data],name);
    }
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
   var mycolor = 'moss';
   var mycat = 'estudiante';
   var   myuuid = mycolor + '-' + mycat;
   var    myavatar = 'images/' + mycat + '.jpg';
   var   mychannel = homework.id + '-' + userSender.id + '-' + userReceiver.id;
    pubnub.publish(  {
     message: {
         uuid: myuuid,
         username : sessionStorage.getItem('username'),
         avatar: myavatar,
         color: mycolor,
         titlemsg: "TAREA NUEVA",
         text: '',
         timestamp: new Date().toISOString(),
         meta:   homework
     },
     channel:  mychannel
   });
}

function sendPaymentMessage(userSender, userReceiver,costo_, homework,Payment){
    var pubnub = new PubNub({ publishKey : 'pub-c-467437f5-5346-4f8c-9ddf-2de1c90a93c8', subscribeKey : 'sub-c-52679430-efef-11e6-b753-0619f8945a4f' });
    var mycolor = 'moss';
    var mycat = 'estudiante';
    var   myuuid = mycolor + '-' + mycat;
    var    myavatar = 'images/' + mycat + '.jpg';
    var   mychannel = homework.id + '-' + userSender.id + '-' + userReceiver.id;

    var myhomework_username = new Object();
    myhomework_username.name = sessionStorage.getItem('username');
    var myAttachment = new Object();
    myAttachment.url = Payment.get('attachment')._url;

    var metaObj = {
        title: homework.get('title'),
        deadline: homework.get('deadline'),
        homework_user: myhomework_username,
        description: homework.get('description'),
        costo: costo_,
        attachment: myAttachment,
        codeTransaction: Payment.get('code')
    };

    pubnub.publish(  {
        message: {
            uuid: myuuid,
            username : sessionStorage.getItem('username'),
            avatar: myavatar,
            color: mycolor,
            titlemsg: "TAREA ACEPTADA",
            text: '',
            timestamp: new Date().toISOString(),
            meta:   metaObj
        },
        channel:  mychannel
    });
}

function saveTableMessage(userSender,userReceiver,cost,PointHomework,PointPayment){

    if(PointPayment=='null'){//funcion saveHomework
        sendFirstMessage (userSender, userReceiver, PointHomework);
    }
    
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
                        //page('/received');
                        sendPaymentMessage(userSender, userReceiver,cost, PointHomework,PointPayment);

                        pubnub.publish({
                            channel: 'chatChannel',
                            message: {foo: 'update-statusProgress', sender_id: sessionStorage.getItem('id'), receiver_id: userReceiver.id }
                        },function(status, response){
                            console.log(status.error, response);
                        });
                        //Cambiamos el estado 
                        var localObj = JSON.parse(localStorage.getItem("expense"));
                        localObj.estado = "en progreso";
                        localStorage.setItem("expense", JSON.stringify(localObj));
                        page('/chat');
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
    $('#spinnerSavePay').prop("active",true);
    $( "#saveButtonPay" ).prop( "disabled", true );

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
        var parseFile = prepareSaveFile(expense._attachments.receipt);
        paymentObj.set("attachment", parseFile);
    }

    var HomeworkClass = Parse.Object.extend("Homework");
    var homework = new HomeworkClass();
    homework.id = expense._id;
    homework.set('status','en progreso');
    homework.set('profesorId',user_receiver.id);//nuevo

    saveTableMessage(user_sender,user_receiver,expense.total,homework,paymentObj);

    app.$.toast.text = 'New object created with objectId: ';
    app.$.toast.show();
}

function chatCotizado(item){
    if(item.estado=='cotizado'){//Muestra la lista de profesores
        var profesoresBox = $('#elementsBoxProfesor');
        profesoresBox.show();
        var comboboxProf = document.querySelector('#elementsBoxProfesor');
        var elements = [];
        for(var i=0;i<item.elementos.length;i++){
            elements.push(item.elementos[i]);
        }
        comboboxProf.items = elements;
        comboboxProf.value = item.elementos[0];

        comboboxProf.addEventListener('selected-item-changed', function() {
            chatCambioProfesor(item);
        });
    }
}

function chatCambioProfesor(item){
    //alert('cambio de profesor');
    var comboboxProf = document.querySelector('#elementsBoxProfesor');
    var id_prof = comboboxProf.selectedItem.sender_user_id;
    var channel =
        item._id + '-' +
        sessionStorage.getItem('id') + '-' +
        id_prof;
    localStorage.setItem("channel", JSON.stringify(channel));
    page('/chat');
}

function sendPay_(){
    page('/pay');
}

function isFileImage(type){
    var typeImg = "image/";
    var tam = typeImg.length;
    for(var i=0;i<tam;i++){
        if(type[i]!=typeImg[i]){
            return false;
        }
    }
    return true;
}

function onerrorImg(source){
    //alert("error image load");
    source.hidden = true;
}

function sendMessageChangeInput(expense,contexto){
    if(expense.estado=='cotizado'){//tiene que enviar pago
       contexto.$.message_normal.hidden = true;
       contexto.$.message_pay.hidden = false;           
    }
    if(expense.estado=='en progreso'){//Puede hablar libremente
        contexto.$.message_normal.hidden = false;
        contexto.$.message_pay.hidden = true;
    }
}

function verificarSchool(){
    if(sessionStorage.getItem('school')=='null'){
        selectSchoolDialog.open();
    }
}

function actualizarSchool(){
    console.log("actualizarSchool");
    var combobox =  document.querySelector('#selectSchool');
    var selectCombobox = combobox.selectedItem;
    if(selectCombobox){
        var User_ = Parse.Object.extend("User");
        var myuser = new User_();
        myuser.id = sessionStorage.getItem('id');
        myuser.set('school',selectCombobox);
        myuser.save(null, {
            success: function(tableExpense) {
                sessionStorage.setItem('school', selectCombobox);
                selectSchoolDialog.close();
            },
            error: function(error) {
                console.log("Error: " + error.code + " " + error.message);
            }
        });
    }
}

function StringSet() {
    var setObj = {}, val = {};

    this.add = function(str) {
        setObj[str] = val;
    };

    this.contains = function(str) {
        return setObj[str] === val;
    };

    this.remove = function(str) {
        delete setObj[str];
    };

    this.values = function() {
        var values = [];
        for (var i in setObj) {
            if (setObj[i] === val) {
                values.push(i);
            }
        }
        return values;
    };
}