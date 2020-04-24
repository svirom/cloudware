var Contact = {
    BaseUrl: '',

    Init: function (baseUrl) {
        Contact.BaseUrl = baseUrl;
        $("#contact-form").on("submit", Contact.SendMessage);
        $("#confirmMessage").hide();
        $("#errorMessage").hide();
    },

    SendMessage: function (event) {
        event.preventDefault();
        var reCaptchaToken = "";
        grecaptcha.execute('6LcuD-cUAAAAAM4nsvQTfmm-Pdr6LRJqVEaLo_Ce', { action: 'homepage' }).then(function (token) {
            reCaptchaToken = token;
        });

        $("#confirmMessage").hide();
        $("#errorMessage").hide();

        const $btn = $(this).find("button[type='submit']");

        $btn.prop("disabled", true);
        $.ajax({
            type: "post",
            contentType: "application/json",
            data: JSON.stringify({
                fullName: $("#fullName").val(),
                email: $("#email").val(),
                phoneNumber: $("#phoneNumber").val(),
                message: $("#message").val(),
                token:reCaptchaToken
    }),
            url: `${Contact.BaseUrl}/ContactApi/SendMessage`,
            success: function () {
                $("#confirmMessage").show();
                $btn.prop("disabled", false);
            },
            error: function (jqXhr, textStatus, errorThrown) {
                $("#errorMessage").hide();
                $btn.prop("disabled", true);
            }
        });
    }
};