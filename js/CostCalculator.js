var CostCalculator = {
    CloudProviderInstances: [],
    BaseUrl: '',

    Init: function (baseUrl) {
        CostCalculator.BaseUrl = baseUrl;
        CostCalculator.GetCloudProvidersInstances();
        CostCalculator.InitStartTime();
        CostCalculator.InitStopTime();
    },

    RemoveInstance: function (event) {
        event.preventDefault();

        const currentLength = $('.btn-calc-close').length;

        if (currentLength > 1) {
            const $row = $(this).closest(".calc-row");
            $row.remove();

            if (currentLength === 2) {
                $('.btn-calc-close').hide();
            }

            $('.btn-calc-add').show();

            CostCalculator.CalculateTotalPrice();
        }
    },

    AddInstance: function (event) {
        event.preventDefault();

        const instances = $(".btn-calc-close").closest(".calc-row");

        const currentLength = instances.length;
        if (currentLength < 10) {
            const lastInstance = instances.last();

            const $row = lastInstance.clone();
            lastInstance.after($row);

            if (currentLength === 9) {
                $(this).hide();
            }

            $('.btn-calc-close').show();

            const cloudProvider = Number($row.find(".calc-select-cloud").val());
            const osType = $row.find(".calc-select-os-type").val();

            CostCalculator.SetInstances($row.find(".calc-select-size"), cloudProvider, osType);
            CostCalculator.CalculatePrice($row);
        }
    },

    GetCloudProvidersInstances: function () {
        $.ajax({
            type: "get",
            contentType: "application/json",
            url: `${CostCalculator.BaseUrl}/CostCalculatorApi/GetCloudProvidersInstances`,
            success: function (data) {
                CostCalculator.CloudProviderInstances = data;
                CostCalculator.Bind();
            },
            error: function (jqXhr, textStatus, errorThrown) {
                alert(jqXhr.responseJSON.error);
            }
        });
    },

    Bind: function () {
        $(".calculator").on("click", ".btn-calc-close", CostCalculator.RemoveInstance);
        $(".btn-calc-add").on("click", CostCalculator.AddInstance);
        $(".calculator").on("change", ".calc-select-cloud", CostCalculator.OnCloudProviderChange);
        $(".calculator").on("change", ".calc-select-size", CostCalculator.OnInstanceChange);
        $(".calculator").on("change", ".calc-number", CostCalculator.OnNumberOfInstanceChange);
        $(".calculator").on("change", ".calc-select-os-type", CostCalculator.OnOsTypeChange);
        $(".stop-time").on("click", CostCalculator.CalculateTotalPrice);
        $(".start-time").on("change", function () {
            CostCalculator.InitStopTime();
            CostCalculator.CalculateTotalPrice();
        });

        const $selectEl = $(".calc-select-cloud");
        const $row = $selectEl.closest(".calc-row");

        const cloudProvider = Number($selectEl.val());
        const osType = $row.find(".calc-select-os-type").val();

        CostCalculator.SetInstances($row.find(".calc-select-size"), cloudProvider, osType);

        CostCalculator.CalculatePrice($row);
    },

    OnNumberOfInstanceChange: function () {
        const $row = $(this).closest(".calc-row");

        CostCalculator.CalculatePrice($row);
    },

    OnCloudProviderChange: function () {
        const cloudProvider = Number($(this).val());

        const $row = $(this).closest(".calc-row");
        const osType = $row.find(".calc-select-os-type").val();

        CostCalculator.SetInstances($row.find(".calc-select-size"), cloudProvider, osType);

        CostCalculator.CalculatePrice($row);
    },

    OnOsTypeChange: function () {
        const $row = $(this).closest(".calc-row");
        const cloudProvider = Number($row.find(".calc-select-cloud").val());
        const osType = $(this).val();

        CostCalculator.SetInstances($row.find(".calc-select-size"), cloudProvider, osType);

        CostCalculator.CalculatePrice($row);
    },

    OnInstanceChange: function () {
        const $row = $(this).closest(".calc-row");

        CostCalculator.CalculatePrice($row);
    },

    SetInstances: function ($selectEl, cloudProvider, osType) {
        $selectEl.empty();
        $.each(CostCalculator.GetInstances(cloudProvider, osType), function (i, item) {
            $selectEl.append($("<option>", {
                value: item.instanceName,
                text: item.instanceName
            }));
        });
    },

    CalculatePrice: function ($row) {
        const numberOfInstances = Number($row.find(".calc-number").val());
        const instanceName = $row.find(".calc-select-size option").filter(":selected").val();
        const cloudProvider = Number($row.find(".calc-select-cloud").val());
        const osType = $row.find(".calc-select-os-type").val();

        $.ajax({
            type: "post",
            contentType: "application/json",
            data: JSON.stringify({
                cloudProvider: cloudProvider,
                instanceName: instanceName,
                osType: osType
            }),
            url: `${CostCalculator.BaseUrl}/CostCalculatorApi/CalculatePrice`,
            beforeSend: function () {
                $('#calc-loader').fadeIn(300);
            },
            success: function (price) {
                $('#calc-loader').fadeOut(300);
                $row.attr('data-price', numberOfInstances * price);

                CostCalculator.CalculateTotalPrice();
            },
            error: function (jqXhr, textStatus, errorThrown) {
                $('#calc-loader').fadeOut(300);
                alert(jqXhr.responseJSON.error);
            }
        });
    },

    CalculateTotalPrice: function () {
        let price = 0.0;
        $(".calc-row").each(function () {
            const value = $(this).attr("data-price");
            if (typeof value !== typeof undefined && value !== false) {
                price += Number(value);
            }
        });

        const valuestart = $(".start-time").val();
        const valuestop = $(".stop-time").val();

        const timeStart = new Date("01/01/2020 " + valuestart);
        const timeEnd = new Date("01/01/2020 " + valuestop);

        let difference = timeEnd - timeStart;
        difference = difference / 60 / 60 / 1000;

        price = price * difference * 30;

        $(".saving-amount-content").text("$" + price.toFixed(3))
    },

    GetInstances: function (cloudProvider, osType) {
        if (cloudProvider === 1) {
            return CostCalculator.CloudProviderInstances.awsInstances.filter(i => i.osType === osType);
        } else if (cloudProvider === 2) {
            return CostCalculator.CloudProviderInstances.azureInstances.filter(i => i.osType === osType);
        } else if (cloudProvider === 3) {
            return CostCalculator.CloudProviderInstances.googleInstances;
        }

        return [];
    },

    InitStartTime: function () {
        const $startTime = $(".start-time");
        $startTime.empty();
        for (let h = 0; h < 23; h++) {
            let hour = h.toString();
            if (h < 10) {
                hour = '0' + hour.toString();
            }

            $startTime.append($("<option>", {
                value: `${hour}:00`,
                text: `${hour}:00`
            }));
        }

        $(".start-time").val("10:00");
    },

    InitStopTime: function () {
        const startTimeVal = $(".start-time").val();
        const startTime = Number(startTimeVal.split(":")[0]);
        const $stopTimeEl = $(".stop-time");
        let stopTimeVal = $stopTimeEl.val();

        if (!stopTimeVal) {
            stopTimeVal = "11:00";
        }

        let stopTime = Number(stopTimeVal.split(":")[0]);

        $stopTimeEl.empty();

        for (let h = startTime + 1; h < 24; h++) {
            let hour = h.toString();
            if (h < 10) {
                hour = '0' + hour.toString();
            }

            $stopTimeEl.append($("<option>", {
                value: `${hour}:00`,
                text: `${hour}:00`
            }));
        }

        if (startTime > stopTime) {
            stopTime = startTime + 1;
        }

        stopTimeVal = stopTime.toString();
        if (stopTime < 10) {
            stopTimeVal = '0' + stopTime.toString();
        }

        $stopTimeEl.val(`${stopTimeVal}:00`);

    }
};