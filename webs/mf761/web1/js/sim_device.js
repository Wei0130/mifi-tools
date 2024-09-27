define("sim_abnormal", "jquery knockout service set main opmode".split(" "), function (f, d, b, c, h, a) {
    function g() {
        var i = f("#container")[0];
        d.cleanNode(i);
        var j = new e();
        d.applyBindings(j, i);
        f("#frmPUK").validate({
            submitHandler: function () {
                j.enterPUK()
            }, rules: {txtNewPIN: "pin_check", txtConfirmPIN: {equalToPin: "#txtNewPIN"}, txtPUK: "puk_check"}
        });
        f("#frmPIN").validate({
            submitHandler: function () {
                j.enterPIN()
            }, rules: {txtPIN: "pin_check"}
        })
    }

    function e() {
        var p = this;
        var n = b.getStatusInfo();
        var l = "PPPOE" == n.blc_wan_mode || "AUTO_PPPOE" == n.blc_wan_mode;
        p.hasRj45 = c.RJ45_SUPPORT;
        p.hasSms = c.HAS_SMS;
        p.hasPhonebook = c.HAS_PHONEBOOK;
        p.isSupportSD = c.SD_CARD_SUPPORT;
        if (c.WIFI_SUPPORT_QR_SWITCH) {
            var k = b.getWifiBasic();
            p.showQRCode = c.WIFI_SUPPORT_QR_CODE && k.show_qrcode_flag
        } else {
            p.showQRCode = c.WIFI_SUPPORT_QR_CODE
        }
        if (c.WIFI_SUPPORT_QR_CODE) {
            p.qrcodeSrc = "./pic/qrcode_ssid_wifikey.png?_=" + f.now()
        } else {
            p.qrcodeSrc = "./pic/res_blacktrans.png"
        }
        p.hasParentalControl = d.observable(c.HAS_PARENTAL_CONTROL && l);
        p.pageState = {NO_SIM: 0, WAIT_PIN: 1, WAIT_PUK: 2, PUK_LOCKED: 3, LOADING: 4};
        p.isHomePage = d.observable(false);
        if (window.location.hash == "#main") {
            p.isHomePage(true)
        }
        var o = b.getLoginData();
        p.PIN = d.observable();
        p.newPIN = d.observable();
        p.confirmPIN = d.observable();
        p.PUK = d.observable();
        p.pinNumber = d.observable(o.pinnumber);
        p.pukNumber = d.observable(o.puknumber);
        var m = i(o);
        p.page = d.observable(m);
        if (m == p.pageState.LOADING) {
            addTimeout(j, 500)
        }
        p.showOpModeWindow = function () {
            showSettingWindow("change_mode", "opmode_popup", "opmode_popup", 400, 300, function () {
            })
        };
        p.isLoggedIn = d.observable(false);
        p.enableFlag = d.observable(false);
        p.refreshOpmodeInfo = function () {
            var r = b.getStatusInfo();
            p.isLoggedIn(r.isLoggedIn);
            if (!l && checkCableMode(r.blc_wan_mode)) {
                if (p.page() == p.pageState.NO_SIM || p.page() == p.pageState.WAIT_PIN || p.page() == p.pageState.WAIT_PUK || p.page() == p.pageState.PUK_LOCKED) {
                    window.location.reload()
                }
            }
            l = checkCableMode(r.blc_wan_mode);
            p.hasParentalControl(c.HAS_PARENTAL_CONTROL && l);
            if (l && r.ethWanMode.toUpperCase() == "DHCP") {
                p.enableFlag(true)
            } else {
                if ((!l && r.connectStatus != "ppp_disconnected") || (l && r.rj45ConnectStatus != "idle" && r.rj45ConnectStatus != "dead")) {
                    p.enableFlag(false)
                } else {
                    p.enableFlag(true)
                }
            }
            var s = (r.blc_wan_mode == "AUTO_PPP" || r.blc_wan_mode == "AUTO_PPPOE") ? "AUTO" : r.blc_wan_mode;
            var q = "";
            switch (s) {
                case"PPP":
                    q = "opmode_gateway";
                    break;
                case"PPPOE":
                    q = "opmode_cable";
                    break;
                case"AUTO":
                    q = "opmode_auto";
                    break;
                default:
                    break
            }
            f("#opmode").attr("data-trans", q).text(f.i18n.prop(q))
        };

        function j() {
            var r = b.getLoginData();
            var q = i(r);
            if (q == p.pageState.LOADING) {
                addTimeout(j, 500)
            } else {
                p.page(q);
                p.pinNumber(r.pinnumber);
                p.pukNumber(r.puknumber)
            }
        }

        p.enterPUK = function () {
            showLoading();
            p.page(p.pageState.LOADING);
            var s = p.newPIN();
            var q = p.confirmPIN();
            var r = {};
            r.PinNumber = s;
            r.PUKNumber = p.PUK();
            b.enterPUK(r, function (t) {
                if (!t.result) {
                    hideLoading();
                    if (p.pukNumber() == 2) {
                        showAlert("last_enter_puk", function () {
                            j()
                        })
                    } else {
                        showAlert("puk_error", function () {
                            j();
                            if (p.page() == p.pageState.PUK_LOCKED) {
                                hideLoading()
                            }
                        })
                    }
                    p.PUK("");
                    p.newPIN("");
                    p.confirmPIN("")
                } else {
                    j();
                    if (p.page() == p.pageState.PUK_LOCKED) {
                        hideLoading()
                    }
                }
            })
        };
        p.enterPIN = function () {
            showLoading();
            p.page(p.pageState.LOADING);
            var q = p.PIN();
            b.enterPIN({PinNumber: q}, function (r) {
                if (!r.result) {
                    hideLoading();
                    if (p.pinNumber() == 2) {
                        showAlert("last_enter_pin", function () {
                            j()
                        })
                    } else {
                        showAlert("pin_error", function () {
                            j()
                        })
                    }
                    p.PIN("")
                }
                j();
                if (p.page() == p.pageState.WAIT_PUK) {
                    hideLoading()
                }
            })
        };
        if (p.hasRj45) {
            p.refreshOpmodeInfo();
            addInterval(function () {
                p.refreshOpmodeInfo()
            }, 1000)
        }

        function i(r) {
            var q = r.modem_main_state;
            if (q == "modem_undetected" || q == "modem_sim_undetected" || q == "modem_sim_destroy") {
                return p.pageState.NO_SIM
            } else {
                if (q == "modem_waitpin") {
                    return p.pageState.WAIT_PIN
                } else {
                    if ((q == "modem_waitpuk" || r.pinnumber == 0) && (r.puknumber != 0)) {
                        return p.pageState.WAIT_PUK
                    } else {
                        if ((r.puknumber == 0 || q == "modem_sim_destroy") && q != "modem_sim_undetected" && q != "modem_undetected") {
                            return p.pageState.PUK_LOCKED
                        } else {
                            if (f.inArray(q, c.TEMPORARY_MODEM_MAIN_STATE) != -1) {
                                return p.pageState.LOADING
                            } else {
                                location.reload()
                            }
                        }
                    }
                }
            }
        }
    }

    return {init: g}
});
define("ota_update", "jquery jq_fileinput service knockout set statusBar".split(" "), function (d, f, e, i, b, c) {
    function a() {
        var l = this;
        var k = e.getOTAUpdateSetting();
        l.allowRoamingUpdate = i.observable(k.allowRoamingUpdate);
        l.hasDdns = b.DDNS_SUPPORT;
        l.hasUpdateCheck = b.HAS_UPDATE_CHECK;
        l.isDataCard = b.PRODUCT_TYPE == "DATACARD";
        l.lastCheckTime = i.observable("");
        l.updateIntervalDay = i.observable(k.updateIntervalDay);
        l.updateMode = i.observable(k.updateMode);
        l.updateType = i.observable(e.getUpdateType().update_type);
        var j = checkCableMode(e.getOpMode().blc_wan_mode);
        var m = e.getExtraFunc();
        l.bandSelectFuncEnable = i.observable(m.bandSelectFuncEnable);
        if (l.bandSelectFuncEnable() == "2" && !j) {
            d(".bandSelect").attr("id", "rootBandSelect")
        } else {
            if (l.bandSelectFuncEnable() == "1" && !j) {
                d(".bandSelect").attr("id", "bandSelect")
            } else {
                d(".bandSelect").attr("id", "removeBandSelect");
                d("#removeBandSelect").css("display", "none")
            }
        }
        l.apply = function () {
            var n = {
                updateMode: l.updateMode(),
                updateIntervalDay: l.updateIntervalDay(),
                allowRoamingUpdate: l.allowRoamingUpdate()
            };
            showLoading();
            e.setOTAUpdateSetting(n, function (o) {
                if (o && o.result == "success") {
                    k.allowRoamingUpdate = l.allowRoamingUpdate();
                    successOverlay()
                } else {
                    errorOverlay()
                }
            })
        };
        l.checkNewVersion = function () {
            var r = e.getNewVersionState();
            if (r.fota_package_already_download == "yes") {
                showAlert("fota_package_already_download");
                return
            }
            if (b.UPGRADE_TYPE == "FOTA") {
                var o = ["checking"];
                if (d.inArray(r.fota_current_upgrade_state, o) != -1) {
                    showAlert("ota_update_running");
                    return
                }
            }
            var p = e.getStatusInfo();
            if (r.fota_current_upgrade_state == "prepare_install") {
                showInfo("ota_download_success");
                return
            }
            var n = ["downloading", "confirm_dowmload"];
            if (d.inArray(r.fota_current_upgrade_state, n) != -1) {
                c.showOTAAlert();
                return
            }
            if (p.roamingStatus) {
                showConfirm("ota_check_roaming_confirm", function () {
                    q()
                })
            } else {
                q()
            }

            function q() {
                showLoading("ota_new_version_checking");

                function s() {
                    var t = e.getNewVersionState();
                    if (t.hasNewVersion) {
                        if (t.fota_new_version_state == "already_has_pkg" && t.fota_current_upgrade_state != "prepare_install" && t.fota_current_upgrade_state != "low_battery") {
                            addTimeout(s, 1000)
                        } else {
                            c.showOTAAlert()
                        }
                    } else {
                        if (t.fota_new_version_state == "no_new_version") {
                            showAlert("ota_no_new_version")
                        } else {
                            if (t.fota_new_version_state == "check_failed") {
                                errorOverlay("ota_check_fail")
                            } else {
                                if (t.fota_new_version_state == "bad_network") {
                                    errorOverlay("ota_connect_server_failed")
                                } else {
                                    addTimeout(s, 1000)
                                }
                            }
                        }
                    }
                }

                e.setUpgradeSelectOp({selectOp: "check"}, function (t) {
                    if (t.result == "success") {
                        s()
                    } else {
                        errorOverlay()
                    }
                })
            }
        };
        l.fixPageEnable = function () {
            var o = e.getStatusInfo();
            var n = e.getOpMode();
            if (checkConnectedStatus(o.connectStatus, n.rj45_state, o.connectWifiStatus)) {
                enableBtn(d("#btnCheckNewVersion"))
            } else {
                disableBtn(d("#btnCheckNewVersion"))
            }
        };
        l.clickAllowRoamingUpdate = function () {
            var n = d("#chkUpdateRoamPermission:checked");
            if (n && n.length == 0) {
                l.allowRoamingUpdate("1")
            } else {
                l.allowRoamingUpdate("0")
            }
        };
        e.getOTAlastCheckTime({}, function (n) {
            l.lastCheckTime(n.dm_last_check_time)
        })
    }

    function g(l) {
        var k = 0;
        var m = /msie/i.test(navigator.userAgent) && !window.opera;
        if (m) {
            var j = l.value;
            try {
                var n = new ActiveXObject("Scripting.FileSystemObject");
                k = parseInt(n.GetFile(j).size)
            } catch (o) {
                k = 1
            }
        } else {
            try {
                k = parseInt(l.files[0].size)
            } catch (o) {
                k = 1
            }
        }
        return k / 1024 / 1024
    }

    function h() {
        var j = d("#container")[0];
        i.cleanNode(j);
        var m = new a();
        i.applyBindings(m, j);
        var l = e.getPassword().CurrentPasswd;
        var k = e.getPassword().RootPasswd;
        if (l != k && l != "xfnj1234") {
            d("#rootBandSelect").css("display", "none")
        }
        if (m.updateType() == "mifi_fota") {
            m.fixPageEnable();
            addInterval(function () {
                m.fixPageEnable()
            }, 1000)
        } else {
            if (d(".customfile").length == 0) {
                d("#fileField").customFileInput()
            }
        }
        d("#frmOTAUpdate").validate({
            submitHandler: function () {
                m.apply()
            }
        })
    }

    return {init: h}
});
define("sd", "jquery set service knockout".split(" "), function (f, c, a, b) {
    var h = c.SD_BASE_PATH;

    function e() {
        var k = this;
        var i = a.getSDConfiguration();
        k.selectedMode = b.observable(i.sd_mode);
        k.orignalMode = b.observable(i.sd_mode);
        k.sdStatus = b.observable(i.sd_status);
        k.orignalSdStatus = b.observable(i.sd_status);
        k.sdStatusInfo = b.observable("sd_card_status_info_" + i.sd_status);
        k.selectedShareEnable = b.observable(i.share_status);
        k.selectedFileToShare = b.observable(i.file_to_share);
        k.selectedAccessType = b.observable(i.share_auth);
        var j = i.share_file.substring(h.length);
        k.pathToShare = b.observable(j);
        k.isInvalidPath = b.observable(false);
        k.checkEnable = b.observable(true);
        addInterval(function () {
            k.refreshSimStatus()
        }, 3000);
        k.checkPathIsValid = b.computed(function () {
            if (k.orignalMode() == 0 && k.selectedShareEnable() == "1" && k.selectedFileToShare() == "0" && k.pathToShare() != "" && k.pathToShare() != "/") {
                a.checkFileExists({path: h + k.pathToShare()}, function (m) {
                    if (m.status != "exist") {
                        k.isInvalidPath(true)
                    } else {
                        k.isInvalidPath(false)
                    }
                })
            } else {
                k.isInvalidPath(false)
            }
        });
        k.disableApplyBtn = b.computed(function () {
            return k.selectedMode() == k.orignalMode() && k.selectedMode() == "1"
        });
        k.fileToShareClickHandle = function () {
            if (k.selectedFileToShare() == "1") {
                k.pathToShare("/")
            }
            return true
        };
        k.refreshSimStatus = function () {
            if (k.checkEnable()) {
                var m = a.getSDConfiguration();
                if (m.sd_status && (m.sd_status != k.orignalSdStatus())) {
                    if (m.sd_status != "1") {
                        k.sdStatusInfo("sd_card_status_info_" + m.sd_status);
                        k.sdStatus(m.sd_status);
                        k.orignalSdStatus(m.sd_status);
                        f("#sd_card_status_info").translate()
                    } else {
                        clearTimer();
                        clearValidateMsg();
                        g()
                    }
                }
            }
        };
        k.save = function () {
            showLoading("waiting");
            k.checkEnable(false);
            if (k.orignalMode() == k.selectedMode()) {
                showAlert("setting_no_change")
            } else {
                a.setSdCardMode({mode: k.selectedMode()}, function (m) {
                    if (m.result) {
                        k.orignalMode(k.selectedMode());
                        if (m.result == "processing") {
                            errorOverlay("sd_usb_forbidden")
                        } else {
                            successOverlay()
                        }
                    } else {
                        if (k.selectedMode() == "0") {
                            errorOverlay("sd_not_support")
                        } else {
                            errorOverlay()
                        }
                    }
                }, function (m) {
                    if (k.selectedMode() == "0") {
                        errorOverlay("sd_not_support")
                    } else {
                        errorOverlay()
                    }
                })
            }
            k.checkEnable(true);
            return true
        };
        k.saveShareDetailConfig = function () {
            showLoading("waiting");
            k.checkEnable(false);
            var m = {
                share_status: k.selectedShareEnable(),
                share_auth: k.selectedAccessType(),
                share_file: h + k.pathToShare()
            };
            if (k.selectedShareEnable() == "0") {
                l(m)
            } else {
                a.checkFileExists({path: m.share_file}, function (n) {
                    if (n.status != "exist" && n.status != "processing") {
                        errorOverlay("sd_card_share_setting_" + n.status)
                    } else {
                        l(m)
                    }
                }, function () {
                    errorOverlay()
                })
            }
            k.checkEnable(true);
            return true
        };

        function l(m) {
            a.setSdCardSharing(m, function (n) {
                if (isErrorObject(n)) {
                    if (n.errorType == "no_sdcard") {
                        errorOverlay("sd_card_share_setting_no_sdcard")
                    } else {
                        errorOverlay()
                    }
                } else {
                    successOverlay()
                }
            })
        }
    }

    function d(k) {
        var j = [];
        for (var l = 0; l < k.length; l++) {
            j.push(new Option(k.name, k.value))
        }
        return j
    }

    function g() {
        var i = f("#container")[0];
        b.cleanNode(i);
        var j = new e();
        b.applyBindings(j, i);
        f("#sd_card_status_info").translate();
        f("#sdmode_form").validate({
            submitHandler: function () {
                j.save()
            }
        });
        f("#httpshare_form").validate({
            submitHandler: function () {
                j.saveShareDetailConfig()
            }, rules: {path_to_share: "check_file_path"}
        })
    }

    return {init: g}
});
define("sd_httpshare", "jquery underscore jq_fileinput set service knockout".split(" "), function (y, M, i, C, g, K) {
    var j = 10;
    var E = 1;
    var L = "";
    var p = C.SD_BASE_PATH;
    var h = "";
    var w = true;
    var v = null;
    var A = null;
    var b = null;
    var H = new Date().getTimezoneOffset() * 60;
    var n = "";
    var l = false;

    function c(O, T, R) {
        if (O == 0) {
            return []
        }
        var U = [];
        var S = J(O, T);
        U.push({pageNum: R - 1, isActive: false, isPrev: true, isNext: false, isDot: false});
        if (R == 6) {
            U.push({pageNum: 1, isActive: false, isPrev: false, isNext: false, isDot: false})
        } else {
            if (R > 5) {
                U.push({pageNum: 1, isActive: false, isPrev: false, isNext: false, isDot: false});
                U.push({pageNum: 0, isPrev: false, isNext: false, isActive: false, isDot: true})
            }
        }
        var Q;
        var P = R - 4 > 0 ? R - 4 : 1;
        var N = R + 4;
        for (Q = P; Q <= N && Q <= S; Q++) {
            U.push({pageNum: Q, isActive: Q == R, isPrev: false, isNext: false, isDot: false})
        }
        if (R + 5 == S) {
            U.push({pageNum: S, isPrev: false, isNext: false, isActive: false, isDot: false})
        } else {
            if (R + 3 <= S && Q - 1 != S) {
                U.push({pageNum: 0, isPrev: false, isNext: false, isActive: false, isDot: true});
                U.push({pageNum: S, isPrev: false, isNext: false, isActive: false, isDot: false})
            }
        }
        U.push({pageNum: parseInt(R, 10) + 1, isPrev: false, isNext: true, isActive: false, isDot: false});
        return U
    }

    function J(P, N) {
        var O = Math.floor(P / N);
        if (P % N != 0) {
            O++
        }
        return O
    }

    function I(P) {
        var O = 0;
        var N = y.map(P, function (R) {
            var Q = {
                fileName: HTMLEncode(R.fileName),
                fileType: R.attribute == "document" ? "folder" : getFileType(R.fileName),
                fileSize: getDisplayVolume(R.size, false),
                filePath: p + s() + "/" + R.fileName,
                lastUpdateTime: transUnixTime((parseInt(R.lastUpdateTime, 10) + H) * 1000),
                trClass: O % 2 == 0 ? "even" : "",
                readwrite: w
            };
            O++;
            return Q
        });
        if (v == null) {
            v = y.template("sdFileItemTmpl", y("#sdFileItemTmpl"))
        }
        y("#fileList_container").html(y.tmpl("sdFileItemTmpl", {data: N}))
    }

    function D() {
        var N = false;
        if (window.location.hash == "#httpshare_guest") {
            N = true
        }
        w = true;
        E = 1;
        m("");
        p = C.SD_BASE_PATH;
        showLoading("waiting");
        g.getSDConfiguration({}, function (O) {
            b = O;
            n = O.share_file;
            if (n.charAt(n.length - 1) == "/") {
                n = n.substring(0, n.length - 1)
            }
            if (O.sd_status == "1" && O.sd_mode == "0") {
                if (N && O.share_status == "1") {
                    p = n;
                    if (O.share_auth == "0") {
                        w = false;
                        y("#uploadSection, #delete_file_button, .sd_guest_hide_th", "#httpshare_form").hide()
                    } else {
                        y("#uploadSection, #delete_file_button, .sd_guest_hide_th", "#httpshare_form").show()
                    }
                    y("#go_to_login_button").removeClass("hide");
                    y("#sd_menu").hide();
                    y(".form-note").hide();
                    if (y(".customfile").length == 0) {
                        y("#fileField").customFileInput()
                    }
                    pagerItemClickHandler(1)
                } else {
                    if (N && O.share_status == "0") {
                        y(".form-body .content", "#httpshare_form").hide().remove();
                        y(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html(y.i18n.prop("httpshare"));
                        y(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_cannot_access").html(y.i18n.prop("note_http_share_cannot_access"));
                        hideLoading()
                    } else {
                        if (y(".customfile").length == 0) {
                            y("#fileField").customFileInput()
                        }
                        pagerItemClickHandler(1)
                    }
                }
            } else {
                y(".form-body .content", "#httpshare_form").hide().remove();
                y(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html(y.i18n.prop("httpshare"));
                y(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_usb_access").html(y.i18n.prop("note_http_share_usb_access"));
                y(".form-note", "#httpshare_form").addClass("margintop10");
                hideLoading()
            }
        }, function () {
            errorOverlay();
            y(".form-body .content", "#httpshare_form").hide().remove();
            y(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html(y.i18n.prop("httpshare"));
            y(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_cannot_access").html(y.i18n.prop("note_http_share_cannot_access"))
        });
        addInterval(function () {
            !l && self.checkSdStatus()
        }, 3000);
        self.checkSdStatus = function () {
            var O = g.getSDConfiguration();
            if (O.sd_status && (O.sd_status != b.sd_status)) {
                if (O.sd_status == "1") {
                    window.location.reload()
                } else {
                    clearTimer();
                    clearValidateMsg();
                    G()
                }
            }
        }
    }

    pagerItemClickHandler = function (N) {
        E = N;
        refreshFileList(s(), E)
    };

    function u() {
        var N = g.getSDConfiguration();
        if (!M.isEqual(b, N)) {
            showAlert("sd_config_changed_reload", function () {
                G()
            });
            return false
        }
        return true
    }

    function q(P, Q) {
        var O = n + "/";
        var N = P + "/";
        if (b.share_status == "1" && n != "" && n != "/" && O.indexOf(N) != -1) {
            showAlert(Q);
            return true
        }
        return false
    }

    enterFolder = function (N) {
        if (!u()) {
            return false
        }
        var O;
        if (N == "") {
            O = ""
        } else {
            O = s() + "/" + N
        }
        refreshFileList(O, 1);
        return true
    };
    backFolder = function () {
        if (!u()) {
            return false
        }
        var N = s().substring(0, s().lastIndexOf("/"));
        refreshFileList(N, 1);
        return true
    };
    refreshBtnsStatus = function () {
        if (s() == "") {
            y("#rootBtnLi, #backBtnLi").hide()
        } else {
            y("#rootBtnLi, #backBtnLi").show()
        }
        if (w) {
            y("#createNewFolderLi").hide();
            y("#createNewFolderLi").find(".error").hide();
            y("#newFolderBtnLi").show();
            y("#newFolderName").val("");
            y("#createNewFolderErrorLabel").removeAttr("data-trans").text("")
        } else {
            y("#newFolderBtnLi, #createNewFolderLi").hide().remove()
        }
        z()
    };
    refreshFileList = function (P, O, N) {
        if (!N) {
            showLoading("waiting")
        }
        g.getFileList({path: h + p + P, index: O}, function (Q) {
            if (isErrorObject(Q)) {
                showAlert(Q.errorType);
                return
            }
            m(P);
            y("#sd_path").val(P);
            E = O;
            totalSize = Q.totalRecord;
            I(Q.details);
            pagination(totalSize);
            refreshBtnsStatus();
            updateSdMemorySizes();
            if (!N) {
                hideLoading()
            }
        })
    };
    openCreateNewFolderClickHandler = function () {
        y("#newFolderBtnLi").hide();
        y("#newFolderName").show();
        y("#createNewFolderLi").show()
    };
    cancelCreateNewFolderClickHandler = function () {
        y("#createNewFolderLi").hide();
        y("#newFolderName").val("");
        y("#newFolderBtnLi").show();
        y("#createNewFolderLi").find(".error").hide()
    };
    createNewFolderClickHandler = function () {
        if (!u()) {
            return false
        }
        var O = y.trim(y("#newFolderName").val());
        var N = h + p + s() + "/" + O;
        showLoading("creating");
        g.checkFileExists({path: N}, function (P) {
            if (P.status == "noexist" || P.status == "processing") {
                g.createFolder({path: N}, function (Q) {
                    if (isErrorObject(Q)) {
                        showAlert(Q.errorType);
                        return false
                    } else {
                        successOverlay();
                        refreshFileList(s(), 1)
                    }
                })
            } else {
                if (P.status == "no_sdcard") {
                    showAlert("no_sdcard", function () {
                        window.location.reload()
                    })
                } else {
                    if (P.status == "exist") {
                        y("#createNewFolderErrorLabel").attr("data-trans", "sd_card_share_setting_exist").text(y.i18n.prop("sd_card_share_setting_exist"));
                        hideLoading()
                    }
                }
            }
        }, function () {
            errorOverlay()
        });
        return true
    };
    renameBtnClickHandler = function (N) {
        var O = h + p + s() + "/" + N;
        if (q(O, "sd_share_path_cant_rename")) {
            return false
        }
        showPrompt("sd_card_folder_name_is_null", function () {
            r(N)
        }, 160, N, F)
    };

    function r(N) {
        if (!u()) {
            return false
        }
        var Q = y("div#confirm div.promptDiv input#promptInput");
        var P = y.trim(Q.val());
        var O = h + p + s() + "/" + P;
        g.checkFileExists({path: O}, function (R) {
            if (R.status == "noexist" || R.status == "processing") {
                hideLoadingButtons();
                var S = h + p + s() + "/" + N;
                g.fileRename({oldPath: S, newPath: O, path: h + p + s()}, function (U) {
                    if (isErrorObject(U)) {
                        showAlert(y.i18n.prop(U.errorType));
                        if (U.errorType == "no_exist") {
                            var T = true;
                            refreshFileList(s(), 1, T)
                        } else {
                            if (U.errorType == "processing") {
                            }
                        }
                    } else {
                        refreshFileList(s(), 1);
                        successOverlay()
                    }
                    showLoadingButtons();
                    return true
                })
            } else {
                if (R.status == "no_sdcard") {
                    showAlert("no_sdcard", function () {
                        window.location.reload()
                    });
                    return false
                } else {
                    if (R.status == "exist") {
                        y(".promptErrorLabel").text(y.i18n.prop("sd_card_share_setting_exist"));
                        return false
                    }
                }
            }
            return true
        }, function () {
            errorOverlay()
        });
        return false
    }

    function F() {
        var Q = y("div#confirm div.promptDiv input#promptInput");
        var O = y.trim(Q.val());
        var P = (h + p + s() + "/" + O).replace("//", "/");
        var N = t(O, P);
        if (1 == N) {
            y(".promptErrorLabel").text(y.i18n.prop("sd_upload_rename_null"));
            return false
        } else {
            if (2 == N) {
                y(".promptErrorLabel").text(y.i18n.prop("sd_card_path_too_long"));
                return false
            } else {
                if (3 == N) {
                    y(".promptErrorLabel").text(y.i18n.prop("check_file_path"));
                    return false
                } else {
                    y(".promptErrorLabel").text("");
                    return true
                }
            }
        }
        return true
    }

    hideLoadingButtons = function () {
        y(".buttons", "#confirm").hide()
    };
    showLoadingButtons = function () {
        y(".buttons", "#confirm").show()
    };
    deleteBtnClickHandler = function () {
        if (!u()) {
            return false
        }
        var P = y("input:checkbox:checked", "#fileList_container");
        var N = "";
        if (!P || P.length == 0) {
            return false
        }
        var O = false;
        y.each(P, function (Q, S) {
            var R = y(S).val();
            if (q(h + p + s() + "/" + R, {msg: "sd_share_path_cant_delete", params: [R]})) {
                O = true;
                return false
            }
            return true
        });
        if (O) {
            return false
        }
        showConfirm("confirm_data_delete", function () {
            y.each(P, function (R, S) {
                N += y(S).val() + "*"
            });
            var Q = h + p + s();
            g.deleteFilesAndFolders({path: Q, names: N}, function (R) {
                if (R.status == "failure") {
                    showAlert("delete_folder_failure")
                } else {
                    if (R.status == "no_sdcard") {
                        showAlert("no_sdcard")
                    } else {
                        if (R.status == "processing") {
                            showAlert("sd_file_processing_cant_delete")
                        } else {
                            if (R.status == "success") {
                                successOverlay()
                            }
                        }
                    }
                }
                refreshFileList(s(), 1)
            }, function () {
                errorOverlay()
            })
        });
        return true
    };
    fileUploadSubmitClickHandler = function (O) {
        if (O) {
            var Q = y.trim(y("div#confirm div.promptDiv input#promptInput").val())
        } else {
            var Q = y(".customfile").attr("title")
        }
        var P = (p + s() + "/" + Q).replace("//", "/");
        var N = o(y("#fileField")[0]);
        if (!e(Q, P, N)) {
            return false
        }
        k(Q, P, N)
    };

    function k(P, O, N) {
        g.getSdMemorySizes({}, function (Q) {
            if (isErrorObject(Q)) {
                showAlert(Q.errorType);
                return false
            }
            if (Q.availableMemorySize < N) {
                showAlert("sd_upload_space_not_enough");
                return false
            }
            y.modal.close();
            showLoading("uploading", '<span data-trans="note_uploading_not_refresh">' + y.i18n.prop("note_uploading_not_refresh") + "</span>");
            g.checkFileExists({path: O}, function (R) {
                if (R.status == "noexist") {
                    y("#fileUploadForm").attr("action", "/cgi-bin/httpshare/" + URLEncodeComponent(P));
                    var S = new Date().getTime();
                    y("#path_SD_CARD_time").val(transUnixTime(S));
                    y("#path_SD_CARD_time_unix").val(Math.round((S - H * 1000) / 1000));
                    if (!f) {
                        d()
                    }
                    l = true;
                    y("#fileUploadForm").submit()
                } else {
                    if (R.status == "no_sdcard") {
                        showAlert("no_sdcard", function () {
                            window.location.reload()
                        })
                    } else {
                        if (R.status == "processing") {
                            showAlert("sd_upload_file_is_downloading")
                        } else {
                            if (R.status == "exist") {
                                showPrompt("sd_upload_rename", function () {
                                    fileUploadSubmitClickHandler(true)
                                }, 160, P, F, a)
                            }
                        }
                    }
                }
            }, function () {
                errorOverlay()
            });
            return true
        })
    }

    var f = false;

    function d() {
        f = true;
        y("#fileUploadIframe").load(function () {
            l = false;
            var O = y("#fileUploadIframe").contents().find("body").html().toLowerCase();
            var N = false;
            if (O.indexOf("success") != -1) {
                successOverlay()
            } else {
                if (O.indexOf("space_not_enough") != -1) {
                    N = true;
                    showAlert("sd_upload_space_not_enough")
                } else {
                    if (O.indexOf("data_lost") != -1) {
                        N = true;
                        showAlert("sd_upload_data_lost")
                    } else {
                        errorOverlay()
                    }
                }
            }
            a();
            refreshFileList(s(), 1, N)
        })
    }

    updateSdMemorySizes = function () {
        g.getSdMemorySizes({}, function (P) {
            if (isErrorObject(P)) {
                showAlert(P.errorType);
                return false
            }
            var O = getDisplayVolume(P.totalMemorySize, false);
            var N = getDisplayVolume(P.totalMemorySize - P.availableMemorySize, false);
            y("#sd_volumn_used").text(N);
            y("#sd_volumn_total").text(O);
            return true
        })
    };
    pagination = function (N) {
        var O = c(N, j, parseInt(E, 10));
        if (A == null) {
            A = y.template("pagerTmpl", y("#pagerTmpl"))
        }
        y(".pager", "#fileListButtonSection").html(y.tmpl("pagerTmpl", {data: {pagers: O, total: J(N, j)}}));
        renderCheckbox();
        y(".content", "#httpshare_form").translate()
    };
    checkFilePathForDownload = function (Q) {
        if (!u()) {
            return false
        }
        var N = Q.lastIndexOf("/");
        var O = Q.substring(0, N + 1);
        var P = Q.substring(N + 1, Q.length);
        if (B(O, true) && B(P, false)) {
            return true
        }
        showAlert("sd_card_invalid_chars_cant_download");
        return false
    };
    gotoLogin = function () {
        window.location.href = "#entry"
    };

    function x() {
        y("#createNewFolderForm").validate({
            submitHandler: function () {
                createNewFolderClickHandler()
            }, rules: {newFolderName: {sd_card_path_too_long: true, check_filefold_name: true}}
        });
        y("p.checkbox", "#httpshare_form").die().live("click", function () {
            addTimeout(function () {
                z()
            }, 100)
        });
        y(".icon-download", "#httpshare_form").die().live("click", function () {
            return checkFilePathForDownload(y(this).attr("filelocal"))
        });
        y(".folderTd", "#httpshare_form").die().live("click", function () {
            return enterFolder(y(this).attr("filename"))
        });
        y(".fileRename", "#httpshare_form").die().live("click", function () {
            return renameBtnClickHandler(y(this).attr("filename"))
        });
        f = false
    }

    function z() {
        var N = y("p.checkbox.checkbox_selected", "#fileListSection");
        if (N.length > 0) {
            enableBtn(y("#delete_file_button"))
        } else {
            disableBtn(y("#delete_file_button"))
        }
    }

    function t(N, O) {
        if (N == "" || N.length > 25) {
            return 1
        }
        if (O.length >= 200) {
            return 2
        }
        if (!B(N, false)) {
            return 3
        }
    }

    function B(P, Q) {
        var U = "+/:*?<>\"'\\|#&`~";
        if (Q) {
            U = "+:*?<>\"'\\|#&`~"
        }
        var O = false;
        var S = false;
        var R = /^\.+$/;
        for (var T = 0; T < P.length; T++) {
            for (var N = 0; N < U.length; N++) {
                if (P.charAt(T) == U.charAt(N)) {
                    O = true;
                    break
                }
            }
            if (R.test(P)) {
                S = true
            }
            if (O || S) {
                return false
            }
        }
        return true
    }

    function e(P, O, N) {
        if (!u()) {
            return false
        }
        if (typeof P == "undefined" || P == "" || P == y.i18n.prop("no_file_selected")) {
            showAlert("sd_no_file_selected");
            return false
        }
        if (O.length >= 200) {
            showAlert("sd_card_path_too_long");
            return false
        }
        if (N / 1024 / 1024 / 1024 > 2) {
            showAlert("sd_file_size_too_big");
            return false
        }
        if (P.indexOf("*") >= 0) {
            showAlert("sd_file_name_invalid");
            return false
        }
        return true
    }

    function a() {
        y("#fileField").closest(".customfile").before('<input id="fileField" name="filename" maxlength="200" type="file" dir="ltr"/>').remove();
        addTimeout(function () {
            y("#fileField").customFileInput()
        }, 0);
        y("#uploadBtn", "#uploadSection").attr("data-trans", "browse_btn").html(y.i18n.prop("browse_btn"));
        y(".customfile", "#uploadSection").removeAttr("title");
        y(".customfile span.customfile-feedback", "#uploadSection").html('<span data-trans="no_file_selected">' + y.i18n.prop("no_file_selected") + "</span>").attr("class", "customfile-feedback")
    }

    function s() {
        return L
    }

    function m(N) {
        if (N.lastIndexOf("/") == N.length - 1) {
            L = N.substring(0, N.length - 1)
        } else {
            L = N
        }
    }

    function o(O) {
        var P = /msie/i.test(navigator.userAgent) && !window.opera;
        if (P) {
            var N = O.value;
            try {
                var R = new ActiveXObject("Scripting.FileSystemObject");
                fileLenth = parseInt(R.GetFile(N).size)
            } catch (Q) {
                fileLenth = 1
            }
        } else {
            try {
                fileLenth = parseInt(O.files[0].size)
            } catch (Q) {
                fileLenth = 1
            }
        }
        return fileLenth
    }

    function G() {
        var N = y("#container")[0];
        K.cleanNode(N);
        var O = new D();
        K.applyBindings(O, N);
        x()
    }

    jQuery.validator.addMethod("check_filefold_name", function (P, O, Q) {
        var N = B(P, false);
        return this.optional(O) || N
    });
    jQuery.validator.addMethod("sd_card_path_too_long", function (R, O, S) {
        var Q = y.trim(y("#newFolderName").val());
        var P = h + p + s() + "/" + Q;
        var N = true;
        if (P.length >= 200) {
            N = false
        }
        return this.optional(O) || N
    });
    return {init: G}
});
define("ussd", "set service knockout jquery".split(" "), function (j, e, c, i) {
    var d = 0;
    var b = true;
    var g = 0;
    var k = false;
    var a = 1;

    function l() {
        var m = i("#container")[0];
        c.cleanNode(m);
        var n = new h();
        c.applyBindings(n, m)
    }

    var f = {SEND: 0, REPLY: 1};

    function h() {
        var n = this;
        n.hasUpdateCheck = j.HAS_UPDATE_CHECK;
        n.ussd_action = c.observable(a);
        n.USSDLocation = c.observable(f.SEND);
        n.USSDReply = c.observable("");
        n.USSDSend = c.observable("");
        n.hasDdns = j.DDNS_SUPPORT;

        function m() {
            if (k) {
                k = true;
                window.clearInterval(d);
                g = 0
            } else {
                if (g > 28) {
                    k = true;
                    window.clearInterval(d);
                    showAlert("ussd_operation_timeout");
                    n.USSDReply("");
                    n.USSDSend("");
                    n.USSDLocation(f.SEND);
                    g = 0
                } else {
                    g++
                }
            }
        }

        n.sendToNet = function () {
            g = 0;
            window.clearInterval(d);
            var q = n.USSDSend();
            var o = 0;
            var r;
            for (o = 0; o < q.length;) {
                r = q.charAt(o);
                if (r == " ") {
                    if (q.length > 1) {
                        q = q.substr(o + 1)
                    } else {
                        q = "";
                        break
                    }
                } else {
                    break
                }
            }
            for (o = q.length - 1; o >= 0 && q.length > 0; --o) {
                r = q.charAt(o);
                if (r == " ") {
                    if (q.length > 1) {
                        q = q.substr(0, o)
                    } else {
                        q = "";
                        break
                    }
                } else {
                    break
                }
            }
            if (("string" != typeof (q)) || ("" == q)) {
                showAlert("ussd_error_input");
                return
            }
            showLoading("waiting");
            var p = {};
            p.operator = "ussd_send";
            p.strUSSDCommand = q;
            p.sendOrReply = "send";
            e.getUSSDResponse(p, function (s, t) {
                hideLoading();
                if (s) {
                    USSD_reset();
                    n.USSDLocation(f.REPLY);
                    n.ussd_action(t.ussd_action);
                    i("#USSD_Content").val(decodeMessage(t.data, true));
                    k = false;
                    g = 0
                } else {
                    showAlert(t)
                }
            })
        };
        n.replyToNet = function () {
            g = 0;
            window.clearInterval(d);
            var q = n.USSDReply();
            var o = 0;
            var r;
            for (o = 0; o < q.length;) {
                r = q.charAt(o);
                if (r == " ") {
                    if (q.length > 1) {
                        q = q.substr(o + 1)
                    } else {
                        q = "";
                        break
                    }
                } else {
                    break
                }
            }
            for (o = q.length - 1; o >= 0 && q.length > 0; --o) {
                r = q.charAt(o);
                if (r == " ") {
                    if (q.length > 1) {
                        q = q.substr(0, o)
                    } else {
                        q = "";
                        break
                    }
                } else {
                    break
                }
            }
            if (("string" != typeof (q)) || ("" == q)) {
                showAlert("ussd_error_input");
                return
            }
            showLoading("waiting");
            var p = {};
            p.operator = "ussd_reply";
            p.strUSSDCommand = q;
            p.sendOrReply = "reply";
            e.getUSSDResponse(p, function (s, t) {
                hideLoading();
                if (s) {
                    n.ussd_action(t.ussd_action);
                    i("#USSD_Content").val(decodeMessage(t.data, true));
                    k = false;
                    USSD_reset();
                    g = 0
                } else {
                    showAlert(t)
                }
            })
        };
        USSD_reset = function () {
            n.USSDReply("");
            n.USSDSend("")
        };
        USSD_cancel = function () {
            e.USSDReplyCancel(function (o) {
            })
        };
        n.noReplyCancel = function () {
            g = 0;
            k = true;
            window.clearInterval(d);
            e.USSDReplyCancel(function (o) {
                if (o) {
                    USSD_reset();
                    n.USSDLocation(f.SEND)
                } else {
                    showAlert("ussd_fail")
                }
            })
        };
        if (b) {
            USSD_cancel();
            b = false
        }
    }

    return {init: l}
});
define("phonebook", "underscore jquery knockout set service jq_chosen".split(" "), function (p, e, b, n, q, g) {
    var o = {SIM: "0", DEVICE: "1"};
    var h = {LIST: 0, NEW: 1, EDIT: 2, VIEW: 3, SEND_MSM: 4};
    var i = function (t) {
        var s = [];
        s.push(new Option(e.i18n.prop("device_book"), o.DEVICE));
        if (t) {
            s.push(new Option(e.i18n.prop("sim_book"), o.SIM))
        }
        return s
    };

    function c() {
        return e("#selectedFilterGroup").val()
    }

    var f = {
        cardColumns: [{
            rowText: "index",
            display: false
        }, {rowText: "name"}, {rowText: "mobile_phone_number"}, {rowText: "home_phone_number"}],
        listColumns: [{
            columnType: "checkbox",
            headerTextTrans: "number",
            rowText: "index",
            width: "10%"
        }, {headerTextTrans: "name", rowText: "name", width: "25%", sortable: true}, {
            columnType: "image",
            headerTextTrans: "save_location",
            rowText: "imgLocation",
            width: "20%",
            sortable: true
        }, {
            headerTextTrans: "mobile_phone_number",
            rowText: "mobile_phone_number",
            width: "30%",
            sortable: true
        }, {headerTextTrans: "group", rowText: "transGroup", width: "15%", sortable: true, needTrans: true}]
    };
    var a = function () {
        var s = [];
        s.push(new Option(e.i18n.prop("common"), "common"));
        s.push(new Option(e.i18n.prop("family"), "family"));
        s.push(new Option(e.i18n.prop("friend"), "friend"));
        s.push(new Option(e.i18n.prop("colleague"), "colleague"));
        return s
    };
    var d = false;

    function k() {
        var J = this;
        J.pageState = b.observable(h.LIST);
        J.initFail = b.observable(true);
        J.hasSms = b.observable(n.HAS_SMS);
        var z = true;
        var G = 0;
        var t = {
            simMaxNameLen: 0,
            simMaxNumberLen: 0,
            IsSimCardFull: true,
            IsDeviceFull: true,
            Used: 0,
            Capacity: 0,
            Ratio: "(0/0)"
        };
        J.capacity = b.observable(t);
        J.phoneBookCapacity = b.observable(t.Ratio);
        J.books = b.observableArray();
        J.gridTemplate = new b.simpleGrid.viewModel({
            tableClass: "table-fixed",
            data: J.books(),
            idName: "index",
            columns: f.listColumns,
            defaultSortField: "name",
            defaultSortDirection: "ASC",
            pageSize: 10,
            tmplType: "list",
            searchColumns: ["name", "mobile_phone_number"],
            primaryColumn: "mobile_phone_number",
            showPager: true,
            rowClickHandler: function (K) {
                J.editBooks(K, "view")
            },
            deleteHandler: function (K) {
                J.deleteOneBook(K)
            },
            changeTemplateHandler: function () {
                J.changeTemplate()
            }
        });
        J.locations = b.observableArray();
        J.originLocation = "";
        J.selectedLocation = b.observable(o.DEVICE);
        J.locationTrans = b.observable();
        J.locationTransText = b.observable();
        J.index = b.observable(-1);
        J.name = b.observable("");
        J.nameMaxLength = b.computed(function () {
            var K = D();
            var L = J.name().substring(0, K);
            J.name(L);
            return D()
        });

        function D() {
            var K = 22;
            if (J.selectedLocation() == o.DEVICE) {
                var L = getEncodeType(J.name());
                if ("UNICODE" == L.encodeType || L.extendLen > 0) {
                    K = 11
                } else {
                    K = 22
                }
            } else {
                var L = getEncodeType(J.name());
                if ("UNICODE" == L.encodeType || L.extendLen > 0) {
                    K = (J.capacity().simMaxNameLen / 2) - 1
                } else {
                    K = J.capacity().simMaxNameLen
                }
            }
            return K
        }

        J.mobile_phone_number = b.observable("");
        J.mobileMaxLength = b.computed(function () {
            var K = x();
            var L = J.mobile_phone_number().substring(0, K);
            J.mobile_phone_number(L);
            return x()
        });

        function x() {
            var K = 40;
            if (J.selectedLocation() == o.DEVICE) {
                K = 40
            } else {
                K = J.capacity().simMaxNumberLen
            }
            return K
        }

        J.home_phone_number = b.observable("");
        J.office_phone_number = b.observable("");
        J.mail = b.observable("");
        J.transEditAreaTitle = b.dependentObservable(function () {
            var K = J.pageState();
            if (K == h.EDIT) {
                return "edit"
            } else {
                if (K == h.NEW) {
                    return "new"
                } else {
                    if (K == h.VIEW) {
                        return "view"
                    }
                }
            }
        });
        var E = a();
        J.groups = b.observableArray(E);
        J.selectedGroup = b.observable();
        J.groupTrans = b.observable();
        J.groupTransText = b.observable();
        J.selectedFilterGroup = b.observable("all");
        J.selectedFilterGroupChangeHandler = function () {
            J.selectedFilterGroup(e("#selectedFilterGroup").val());
            u()
        };
        J.showErrorInfo = b.observable(false);
        J.messageContent = b.observable("");
        J.messageCount = b.computed(function () {
            var aa = e("#txtSmsContent", "#sendMessage");
            var O = aa[0];
            J.messageContent();
            var Z = aa.val();
            var T = getEncodeType(Z);
            var P = T.encodeType == "UNICODE" ? 335 : 765;
            if (Z.length + T.extendLen > P) {
                var Q = O.scrollTop;
                var Y = getInsertPos(O);
                var X = Z.length + T.extendLen - P;
                var R = Z.substr(Y - X > 0 ? Y - X : 0, X);
                var V = R.split("").reverse();
                var L = 0;
                var W = 0;
                for (var U = 0; U < V.length; U++) {
                    if (getEncodeType(V[U]).extendLen > 0) {
                        L += 2
                    } else {
                        L++
                    }
                    if (L >= X) {
                        W = U + 1;
                        break
                    }
                }
                var N = Y - W;
                J.messageContent(Z.substr(0, N) + Z.substr(Y));
                if (J.messageContent().length > P) {
                    J.messageContent(J.messageContent().substr(0, P))
                }
                setInsertPos(O, N);
                O.scrollTop = Q
            }
            y();
            var M = e(O).val();
            var S = getEncodeType(M);
            var K = S.encodeType == "UNICODE" ? 335 : 765;
            if (M.length + S.extendLen >= K) {
                e("#msgCount").addClass("colorRed")
            } else {
                e("#msgCount").removeClass("colorRed")
            }
            return "(" + (M.length + S.extendLen) + "/" + K + ")(" + getSmsCount(M) + "/5)"
        });
        J.clear = function (K) {
            if (J.pageState() == h.SEND_MSM) {
                B(F, K)
            } else {
                F(K)
            }
            n.resetContentModifyValue()
        };
        J.btnClear = function (K) {
            if (J.pageState() == h.SEND_MSM) {
                B(F, K);
                n.resetContentModifyValue()
            } else {
                if ((J.pageState() == h.NEW || J.pageState() == h.EDIT) && (J.preContent.location != J.selectedLocation() || J.preContent.name != J.name() || J.preContent.mobile_phone_number != J.mobile_phone_number() || J.preContent.home_phone_number != J.home_phone_number() || J.preContent.office_phone_number != J.office_phone_number() || J.preContent.mail != J.mail() || J.preContent.group != J.selectedGroup())) {
                    showConfirm("leave_page_info", {
                        ok: function () {
                            F(K);
                            n.resetContentModifyValue()
                        }, no: function () {
                            return false
                        }
                    })
                } else {
                    F(K);
                    n.resetContentModifyValue()
                }
            }
        };

        function F(K) {
            e("#frmPhoneBook").hide();
            J.pageState(h.LIST);
            J.index(-1);
            J.name("");
            J.mobile_phone_number("");
            J.home_phone_number("");
            J.office_phone_number("");
            J.mail("");
            J.messageContent("");
            if (true == K) {
                A()
            }
            J.gridTemplate.clearAllChecked();
            clearValidateMsg();
            e("#books ").translate();
            e("#frmPhoneBook").show()
        }

        J.checkHasSIMCard = function (L) {
            var K = q.getStatusInfo();
            if (K.simStatus != "modem_init_complete") {
                if (L) {
                    showAlert("sim_removed", function () {
                        J.pageState(h.LIST);
                        J.clear(true)
                    })
                }
                return false
            }
            return true
        };
        J.save = function () {
            var L = function (P) {
                var R = (K == o.SIM);
                if (R) {
                    if (!J.checkHasSIMCard(true)) {
                        return
                    }
                }
                if (J.pageState() == h.NEW || (J.pageState() == h.EDIT && K != J.originLocation)) {
                    if (R) {
                        if (J.capacity().IsSimCardFull) {
                            showAlert("sim_full");
                            return
                        }
                    } else {
                        if (J.capacity().IsDeviceFull) {
                            showAlert("device_full");
                            return
                        }
                    }
                }
                var O = J.name();
                var N = J.mobile_phone_number();
                if (e.trim(O) == "" || e.trim(N) == "") {
                    return
                }
                showLoading("saving");
                var Q = {};
                Q.location = K;
                Q.index = P;
                Q.name = O;
                Q.mobile_phone_number = N;
                if (!R) {
                    Q.home_phone_number = J.home_phone_number();
                    Q.office_phone_number = J.office_phone_number();
                    Q.mail = J.mail();
                    Q.group = J.selectedGroup()
                }
                if (J.selectedLocation() != J.originLocation) {
                    Q.delId = J.index()
                }
                q.savePhoneBook(Q, J.callback)
            };
            var K = J.selectedLocation();
            var M = (K == J.originLocation) ? J.index() : -1;
            if (K == o.SIM && J.originLocation == o.DEVICE) {
                showConfirm("change_device_to_sim_confirm", function () {
                    L(M)
                })
            } else {
                L(M)
            }
        };
        J.openNewPage = function () {
            if (J.pageState() == h.SEND_MSM) {
                y();
                B(I, false)
            } else {
                if (J.pageState() == h.EDIT && (J.preContent.location != J.selectedLocation() || J.preContent.name != J.name() || J.preContent.mobile_phone_number != J.mobile_phone_number() || J.preContent.home_phone_number != J.home_phone_number() || J.preContent.office_phone_number != J.office_phone_number() || J.preContent.mail != J.mail() || J.preContent.group != J.selectedGroup())) {
                    showConfirm("leave_page_info", {
                        ok: function () {
                            I(false)
                        }, no: function () {
                            return false
                        }
                    })
                } else {
                    I(false)
                }
            }
        };

        function I(K) {
            J.pageState(h.NEW);
            J.selectedLocation(o.DEVICE);
            J.originLocation = "";
            if (J.checkHasSIMCard(false)) {
                J.locations(i(true))
            } else {
                J.locations(i(false))
            }
            var L = c();
            if (L != "all") {
                J.selectedGroup(L)
            } else {
                J.selectedGroup("common")
            }
            J.name("");
            J.mobile_phone_number("");
            J.home_phone_number("");
            J.office_phone_number("");
            J.mail("");
            J.index(-1);
            J.dynamicTranslate();
            s()
        }

        J.openPage = function (M) {
            var L;
            if (J.pageState() == h.LIST) {
                var K = J.checkSelect(M);
                if (!K.isCorrectData) {
                    return
                }
                L = K.selectedIds[0]
            } else {
                L = J.index()
            }
            J.editBooks(L, M)
        };
        J.openViewPage = function () {
            J.openPage("view")
        };
        J.openEditPage = function () {
            J.openPage("edit");
            if (e.browser.mozilla) {
                e("#txtName, #txtMobile").removeAttr("maxlength")
            }
            s()
        };
        J.editBooks = function (K, O) {
            if (!K) {
                return
            }
            if (J.checkHasSIMCard(false)) {
                J.locations(i(true))
            } else {
                J.locations(i(false))
            }
            var P = J.books();
            for (var N = 0; N < P.length; N++) {
                var Q = P[N];
                if (Q.index == K) {
                    J.index(Q.index);
                    J.selectedLocation(Q.location);
                    J.originLocation = Q.location;
                    var M = (Q.location == o.DEVICE) ? "device" : "sim";
                    J.locationTrans(M);
                    var L = e.i18n.prop("trans");
                    J.locationTransText(L);
                    J.name(Q.name);
                    J.mobile_phone_number(Q.mobile_phone_number);
                    J.home_phone_number(Q.home_phone_number);
                    J.office_phone_number(Q.office_phone_number);
                    J.mail(Q.mail);
                    J.selectedGroup(Q.group);
                    J.groupTrans("group_" + Q.group);
                    J.groupTransText(e.i18n.prop(J.groupTrans()));
                    if (O == "edit") {
                        J.pageState(h.EDIT)
                    } else {
                        J.pageState(h.VIEW)
                    }
                    break
                }
            }
            J.dynamicTranslate();
            if (J.selectedLocation() == o.SIM) {
                J.checkHasSIMCard(true)
            }
        };
        J.dynamicTranslate = function () {
            e("#container").translate()
        };
        J.deleteOneBook = function (K) {
            showConfirm("confirm_pb_delete", function () {
                showLoading("deleting");
                var L = {};
                L.indexs = [String(K)];
                q.deletePhoneBooks(L, J.callback)
            });
            return false
        };
        J.deleteBook = function () {
            J.deleteOneBook(J.index())
        };
        J.deleteBooks = function () {
            var K = J.checkSelect("delete");
            if (!K.isCorrectData) {
                return
            }
            showConfirm("confirm_pb_delete", function () {
                showLoading("deleting");
                var L = {};
                L.indexs = K.selectedIds;
                q.deletePhoneBooks(L, J.callback)
            })
        };
        J.checkSelect = function (K) {
            var L;
            if ("send" == K) {
                L = J.gridTemplate.selectedPrimaryValue()
            } else {
                L = J.gridTemplate.selectedIds()
            }
            var M = true;
            if (L.length == 0) {
                showAlert("no_data_selected");
                M = false
            } else {
                if ("edit" == K || "view" == K) {
                    if (L.length > 1) {
                        showAlert("too_many_data_selected");
                        M = false
                    }
                } else {
                    if ("send" == K) {
                        if (L.length > 5) {
                            showAlert("max_send_number");
                            M = false
                        }
                    }
                }
            }
            return {selectedIds: L, isCorrectData: M}
        };
        J.deleteAllBooks = function () {
            showConfirm("confirm_data_delete", function () {
                showLoading("deleting");
                var K = c();
                var L = {};
                if (K == "all") {
                    L.location = 2;
                    q.deleteAllPhoneBooks(L, J.callback)
                } else {
                    L.location = 3;
                    L.group = K;
                    q.deleteAllPhoneBooksByGroup(L, J.callback)
                }
            })
        };
        J.callback = function (K) {
            if (K && K.result == "success") {
                J.clear(true);
                e("#books ").translate();
                renderCheckbox();
                successOverlay(null, true)
            } else {
                errorOverlay()
            }
        };
        J.changeTemplate = function () {
            if (J.gridTemplate.tmplType == "card") {
                J.gridTemplate.tmplType = "list";
                J.gridTemplate.pageSize = 10;
                J.gridTemplate.columns = f.listColumns
            } else {
                J.gridTemplate.tmplType = "card";
                J.gridTemplate.pageSize = 10;
                J.gridTemplate.columns = f.cardColumns
            }
            A();
            e("#books ").translate()
        };
        J.openSendMessagePage = function () {
            if (h.SEND_MSM == J.pageState()) {
                return
            }
            if ((J.pageState() == h.EDIT || h.NEW == J.pageState()) && (J.preContent.location != J.selectedLocation() || J.preContent.name != J.name() || J.preContent.mobile_phone_number != J.mobile_phone_number() || J.preContent.home_phone_number != J.home_phone_number() || J.preContent.office_phone_number != J.office_phone_number() || J.preContent.mail != J.mail() || J.preContent.group != J.selectedGroup())) {
                showConfirm("leave_page_info", {
                    ok: function () {
                        v()
                    }, no: function () {
                        return false
                    }
                })
            } else {
                v()
            }
        };

        function v() {
            if (h.NEW == J.pageState()) {
                J.pageState(h.SEND_MSM);
                showAlert("no_data_selected");
                J.clear();
                return
            }
            var L = null;
            if (h.LIST == J.pageState()) {
                var S = J.checkSelect("send");
                if (!S.isCorrectData) {
                    return
                }
                L = S.selectedIds
            } else {
                L = J.mobile_phone_number()
            }
            var Q = e("#chosenUserList .chosen-select-deselect");
            Q.empty();
            var R = [];
            var O = [];
            for (var N = 0; N < n.phonebook.length; N++) {
                var M = n.phonebook[N];
                if (e.inArray(M.pbm_number, O) == -1) {
                    R.push(new Option(M.pbm_name + "/" + M.pbm_number, M.pbm_number, false, true));
                    O.push(M.pbm_number)
                } else {
                    for (var P = 0; P < R.length; P++) {
                        if (R[P].value == M.pbm_number) {
                            R[P].text = M.pbm_name + "/" + M.pbm_number;
                            break
                        }
                    }
                }
            }
            var K = "";
            e.each(R, function (T, U) {
                K += "<option value='" + HTMLEncode(U.value) + "'>" + HTMLEncode(U.text) + "</option>"
            });
            Q.append(K);
            Q.chosen({max_selected_options: 5, search_contains: true, width: "545px"});
            e("#chosenUserSelect").val(L);
            e("#chosenUserSelect").trigger("chosen:updated.chosen");
            n.resetContentModifyValue();
            y();
            J.pageState(h.SEND_MSM)
        }

        J.sendMessage = function () {
            q.getSmsCapability({}, function (L) {
                var M = L.nvUsed < L.nvTotal;
                if (!M) {
                    showAlert("sms_capacity_is_full_for_send");
                    return false
                }
                var K = syncSelectAndChosen(e("select#chosenUserSelect"), e(".search-choice", "#chosenUserSelect_chosen"));
                if (K.length + L.nvUsed > L.nvTotal) {
                    showAlert({msg: "sms_capacity_will_full_just", params: [L.nvTotal - L.nvUsed]});
                    return false
                }
                J.sendMessageAction();
                return true
            })
        };
        J.sendMessageAction = function () {
            var K = syncSelectAndChosen(e("select#chosenUserSelect"), e(".search-choice", "#chosenUserSelect_chosen"));
            if (!K || K.length == 0) {
                J.showErrorInfo(true);
                var Q = addTimeout(function () {
                    J.showErrorInfo(false);
                    window.clearTimeout(Q)
                }, 5000);
                return
            }
            var N = J.messageContent();
            var M = 0;
            var O = 0;
            if (K.length > 1) {
                showLoading("sending", "<button id='btnStopSending' onclick='phoneBookStopSMSSending();' class='btn btn-primary'>" + e.i18n.prop("sms_stop_sending") + "</button>")
            } else {
                showLoading("sending")
            }
            var P = function (R) {
                M++;
                if (M == K.length) {
                    e("#chosenUserSelect").val("");
                    J.messageContent("");
                    n.CONTENT_MODIFIED.modified = false;
                    if (O == 0) {
                        successOverlay();
                        location.hash = "#msg_list"
                    } else {
                        var S = e.i18n.prop("success_info") + e.i18n.prop("colon") + (M - O) + "<br/>" + e.i18n.prop("error_info") + e.i18n.prop("colon") + (O);
                        showAlert(S, function () {
                            location.hash = "#msg_list"
                        })
                    }
                } else {
                    L()
                }
            };
            d = false;
            var L = function () {
                if (d) {
                    hideLoading();
                    return
                }
                if ((M + 1) == K.length) {
                    e("#loading #loading_container").html("")
                }
                q.sendSMS({number: K[M], message: N, id: -1}, function (R) {
                    P(R)
                }, function (R) {
                    O++;
                    P(R)
                })
            };
            L()
        };
        J.clearSearchKey = function () {
            J.gridTemplate.searchInitStatus(true);
            J.gridTemplate.searchKey(e.i18n.prop("search"));
            e("#ko_grid_search_txt").addClass("ko-grid-search-txt-default").attr("data-trans", "search")
        };
        J.searchTextClick = function () {
            var K = e("#ko_grid_search_txt");
            if (K.hasClass("ko-grid-search-txt-default")) {
                J.gridTemplate.searchKey("");
                J.gridTemplate.searchInitStatus(false);
                K.removeClass("ko-grid-search-txt-default").removeAttr("data-trans")
            }
        };
        J.searchTextBlur = function () {
            var K = e.trim(J.gridTemplate.searchKey()).toLowerCase();
            if (K == "") {
                J.clearSearchKey()
            }
        };
        J.hasData = b.computed(function () {
            return J.gridTemplate.afterSearchData().length > 0
        });
        J.hasChecked = b.computed(function () {
            return J.gridTemplate.checkedCount() > 0
        });
        J.canSend = b.computed(function () {
            var K = J.gridTemplate.checkedCount();
            if (!J.checkHasSIMCard(false)) {
                return false
            }
            return (K > 0 && K <= 5)
        });
        J.draftListenerEvent = function () {
            y()
        };

        function y() {
            var M = true;
            if (M) {
                var N = J.messageContent();
                var L = false;
                var K = getSelectValFromChosen(e(".search-choice", "#chosenUserSelect_chosen"));
                var O = !(K && K.length > 0);
                if (typeof N == "undefined" || N == "") {
                    n.resetContentModifyValue();
                    return false
                } else {
                    L = true
                }
                if (L && !O) {
                    n.CONTENT_MODIFIED.modified = true;
                    n.CONTENT_MODIFIED.message = "sms_to_save_draft";
                    n.CONTENT_MODIFIED.callback.ok = C;
                    n.CONTENT_MODIFIED.callback.no = e.noop;
                    n.CONTENT_MODIFIED.data = {content: N, numbers: K};
                    return false
                }
                if (L && O) {
                    n.CONTENT_MODIFIED.modified = true;
                    n.CONTENT_MODIFIED.message = "sms_no_recipient";
                    n.CONTENT_MODIFIED.callback.ok = e.noop;
                    n.CONTENT_MODIFIED.callback.no = function () {
                        return true
                    };
                    return false
                }
            }
        }

        function C(K) {
            var M = new Date();
            var L = {
                index: -1,
                currentTimeString: getCurrentTimeString(M),
                groupId: K.numbers.length > 1 ? M.getTime() : "",
                message: K.content,
                numbers: K.numbers
            };
            q.saveSMS(L, function () {
                successOverlay("sms_save_draft_success")
            }, function () {
                errorOverlay("sms_save_draft_failed")
            })
        }

        function B(L, K) {
            if (n.CONTENT_MODIFIED.message != "sms_to_save_draft") {
                if (n.CONTENT_MODIFIED.modified) {
                    showConfirm(n.CONTENT_MODIFIED.message, {
                        ok: function () {
                            n.CONTENT_MODIFIED.callback.ok(n.CONTENT_MODIFIED.data);
                            L(K)
                        }, no: function () {
                            if (n.CONTENT_MODIFIED.message == "sms_to_save_draft") {
                                L(K)
                            }
                            return false
                        }
                    });
                    return false
                } else {
                    L(K)
                }
            } else {
                n.CONTENT_MODIFIED.callback.ok(n.CONTENT_MODIFIED.data);
                L(K)
            }
        }

        function u() {
            q.getPhoneBookReady({}, function (M) {
                if (M.pbm_init_flag == "6") {
                    J.initFail(true);
                    hideLoading();
                    showAlert("phonebook_init_fail")
                } else {
                    if (M.pbm_init_flag != "0") {
                        addTimeout(u, 1000)
                    } else {
                        J.initFail(false);
                        var K = r();
                        J.capacity(K);
                        J.phoneBookCapacity(K.Ratio);
                        var L = m(K.Used);
                        J.books(L);
                        J.gridTemplate.data(L);
                        e("#books").find("tbody").translate();
                        hideLoading()
                    }
                }
            })
        }

        showLoading("waiting");
        addTimeout(u, 200);

        function A() {
            showLoading();
            var K = r();
            J.phoneBookCapacity(K.Ratio);
            J.capacity(K);
            var L = m(K.Used);
            J.books(L);
            J.gridTemplate.data(L);
            hideLoading()
        }

        J.preContent = {};

        function w() {
            J.preContent.location = J.selectedLocation();
            J.preContent.name = J.name();
            J.preContent.mobile_phone_number = J.mobile_phone_number();
            J.preContent.home_phone_number = J.home_phone_number();
            J.preContent.office_phone_number = J.office_phone_number();
            J.preContent.mail = J.mail();
            J.preContent.group = J.selectedGroup()
        }

        function H() {
            var K = (J.preContent.location != J.selectedLocation() || J.preContent.name != J.name() || J.preContent.mobile_phone_number != J.mobile_phone_number() || J.preContent.home_phone_number != J.home_phone_number() || J.preContent.office_phone_number != J.office_phone_number() || J.preContent.mail != J.mail() || J.preContent.group != J.selectedGroup());
            n.CONTENT_MODIFIED.modified = K
        }

        function s() {
            n.resetContentModifyValue();
            w();
            n.CONTENT_MODIFIED.checkChangMethod = H
        }
    }

    phoneBookStopSMSSending = function () {
        d = true;
        e("#loading #loading_container").html(e.i18n.prop("sms_cancel_sending"))
    };

    function m(t) {
        var s = {};
        s.page = 0;
        s.data_per_page = t;
        s.orderBy = "name";
        s.isAsc = true;
        var v = [];
        var u = c();
        if (n.HAS_SMS) {
            v = q.getPhoneBooks(s);
            n.phonebook = v.pbm_data;
            if (u != "all") {
                v = {
                    pbm_data: p.filter(v.pbm_data, function (w) {
                        return w.pbm_group == u
                    })
                }
            }
        } else {
            if (u != "all") {
                s.group = u;
                v = q.getPhoneBooksByGroup(s)
            } else {
                v = q.getPhoneBooks(s)
            }
        }
        return j(v.pbm_data)
    }

    function r() {
        var s = q.getSIMPhoneBookCapacity();
        var t = q.getDevicePhoneBookCapacity();
        return {
            simUsed: s.simPbmUsedCapacity,
            deviceUsed: t.pcPbmUsedCapacity,
            simCapacity: s.simPbmTotalCapacity,
            deviceCapacity: t.pcPbmTotalCapacity,
            simMaxNameLen: s.maxNameLen,
            simMaxNumberLen: s.maxNumberLen,
            IsSimCardFull: (s.simPbmUsedCapacity == s.simPbmTotalCapacity),
            IsDeviceFull: (t.pcPbmUsedCapacity == t.pcPbmTotalCapacity),
            Used: s.simPbmUsedCapacity + t.pcPbmUsedCapacity,
            Capacity: s.simPbmTotalCapacity + t.pcPbmTotalCapacity,
            Ratio: "(" + (s.simPbmUsedCapacity + t.pcPbmUsedCapacity) + "/" + (s.simPbmTotalCapacity + t.pcPbmTotalCapacity) + ")"
        }
    }

    function j(y) {
        var u = [];
        var x = c();
        var s = (x != "all");
        if (y) {
            for (var v = 0; v < y.length; v++) {
                if (s) {
                    var w = y[v].pbm_group;
                    if (y[v].pbm_location == o.SIM || w != x) {
                        continue
                    }
                }
                var t = {
                    index: y[v].pbm_id,
                    location: y[v].pbm_location,
                    imgLocation: y[v].pbm_location == o.SIM ? "pic/simcard.png" : "pic/res_device.png",
                    name: y[v].pbm_name,
                    mobile_phone_number: y[v].pbm_number,
                    home_phone_number: y[v].pbm_anr,
                    office_phone_number: y[v].pbm_anr1,
                    mail: y[v].pbm_email,
                    group: y[v].pbm_group,
                    transGroup: (!y[v].pbm_group) ? "group_null" : "group_" + y[v].pbm_group
                };
                u.push(t)
            }
        }
        return u
    }

    function l() {
        var s = e("#container");
        b.cleanNode(s[0]);
        var t = new k();
        b.applyBindings(t, s[0]);
        e("#txtSmsContent").die().live("contextmenu", function () {
            return false
        });
        e("#frmPhoneBook").validate({
            submitHandler: function () {
                t.save()
            },
            rules: {
                txtMail: "email_check",
                txtName: "name_check",
                txtMobile: "phonenumber_check",
                txtHomeNumber: "phonenumber_check",
                txtOfficeNumber: "phonenumber_check"
            }
        })
    }

    return {init: l}
});
define("sms_list", "underscore jquery knockout set service jq_chosen".split(" "), function (Y, B, T, G, d, K) {
    var n = 1;
    var f = false, O = false;
    var Q = null, s = null, x = null, c = null, m = [], u = [], i = {}, D = {}, v = true;

    function R(Z) {
        return d.getSMSMessages({
            page: 0,
            smsCount: 500,
            nMessageStoreType: 1,
            tags: 10,
            orderBy: "order by id desc"
        }, function (aa) {
            tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), aa.messages.length);
            G.dbMsgs = aa.messages;
            G.listMsgs = k(G.dbMsgs);
            Z()
        }, function () {
            tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), 0);
            G.dbMsgs = [];
            G.listMsgs = [];
            cleanSmsList()
        })
    }

    cleanSmsList = function () {
        B("#smslist-table").empty()
    };

    function k(aa) {
        var Z = {}, ab = [];
        G.listMsgs = [];
        m = [];
        B.each(aa, function (ac, ae) {
            if (ae.tag == "4" && ae.groupId != "") {
                m.push(ae);
                return
            }
            ae.target = ae.number;
            if (parseInt(ae.id, 10) > G.smsMaxId) {
                G.smsMaxId = ae.id
            }
            var ad = getLastNumber(ae.number, G.SMS_MATCH_LENGTH);
            if (ad in Z) {
                Z[ad].push(ae)
            } else {
                Z[ad] = [ae];
                ab.push(ae)
            }
        });
        ab = Y.sortBy(ab, function (ac) {
            return 0 - parseInt(ac.id + "", 10)
        });
        B.each(ab, function (ah, af) {
            var ad = getLastNumber(af.number, G.SMS_MATCH_LENGTH);
            var ae = 0;
            var ag = false;
            for (var ac = 0; ac < Z[ad].length; ac++) {
                if (Z[ad][ac].isNew) {
                    ae++
                }
                if (Z[ad][ac].tag == "4" && Z[ad][ac].groupId == "") {
                    ag = true
                }
            }
            G.listMsgs.push({
                id: Z[ad][0].id,
                name: "",
                number: Z[ad][0].number,
                latestId: Z[ad][0].id,
                totalCount: Z[ad].length,
                newCount: ae,
                latestSms: Z[ad][0].content,
                latestTime: Z[ad][0].time,
                checked: false,
                itemId: getLastNumber(ad, G.SMS_MATCH_LENGTH),
                groupId: Z[ad][0].groupId,
                hasDraft: ag
            })
        });
        return G.listMsgs
    }

    function M() {
        var Z = d.getPhoneBooks({page: 0, data_per_page: 2000, orderBy: "name", isAsc: true});
        if (B.isArray(Z.pbm_data) && Z.pbm_data.length > 0) {
            G.phonebook = Z.pbm_data
        }
        E()
    }

    function E() {
        var ah = B("#chosenUserList .chosen-select-deselect");
        ah.empty();
        var Z = [];
        var an = [];
        var ao = [];
        for (var aj = 0; aj < G.phonebook.length; aj++) {
            var ad = G.phonebook[aj];
            var aa = getLastNumber(ad.pbm_number, G.SMS_MATCH_LENGTH);
            if (aa && B.inArray(aa, ao) == -1) {
                Z.push(new Option(ad.pbm_name + "/" + ad.pbm_number, aa, false, true));
                if (B.inArray(aa, an) == -1) {
                    an.push(aa)
                }
                ao.push(aa)
            } else {
                for (var ak = 0; ak < Z.length; ak++) {
                    if (Z[ak].value == aa) {
                        Z[ak].text = ad.pbm_name + "/" + ad.pbm_number;
                        break
                    }
                }
            }
        }
        var af = [];
        for (var ai = 0; ai < m.length; ai++) {
            if (B.inArray(m[ai].groupId, af) == -1) {
                af.push(m[ai].groupId);
                var ag = m[ai];
                i[m[ai].groupId] = [ag]
            } else {
                var ag = m[ai];
                i[m[ai].groupId].push(ag)
            }
            var ac = getLastNumber(m[ai].number, G.SMS_MATCH_LENGTH);
            if (B.inArray(ac, an) == -1) {
                Z.push(new Option(m[ai].number, ac));
                an.push(ac)
            }
        }
        for (var am in i) {
            var ab = i[am];
            var ap = ab[ab.length - 1];
            ap.draftShowName = "";
            ap.draftShowNameTitle = "";
            B.each(ab, function (ar, au) {
                var at = getShowNameByNumber(au.number);
                ap.draftShowName += (ar == 0 ? "" : ";") + at;
                ap.draftShowNameTitle += (ar == 0 ? "" : ";") + at
            });
            var al = 10;
            if (getEncodeType(ap.draftShowName).encodeType == "UNICODE") {
                al = 10
            }
            ap.draftShowName = ap.draftShowName.length > al ? ap.draftShowName.substring(0, al) + "..." : ap.draftShowName;
            ap.totalCount = ab.length;
            ap.hasDraft = true;
            ap.latestTime = ap.time;
            u.push(ap)
        }
        for (var ak = 0; ak < G.listMsgs.length; ak++) {
            var aq = G.listMsgs[ak];
            for (var aj = G.phonebook.length; aj > 0; aj--) {
                var ad = G.phonebook[aj - 1];
                var aa = getLastNumber(ad.pbm_number, G.SMS_MATCH_LENGTH);
                if (aq.itemId == aa) {
                    aq.name = ad.pbm_name;
                    for (var ai = 0; ai < Z.length; ai++) {
                        if (aa == Z[ai].value) {
                            Z[ai].value = getLastNumber(aq.number, G.SMS_MATCH_LENGTH);
                            Z[ai].text = ad.pbm_name + "/" + aq.number;
                            break
                        }
                    }
                    break
                }
            }
            if (B.inArray(aq.itemId, an) == -1) {
                Z.push(new Option(aq.number, getLastNumber(aq.number, G.SMS_MATCH_LENGTH)));
                an.push(aq.itemId)
            }
        }
        var ae = "";
        B.each(Z, function (ar, at) {
            ae += "<option value='" + HTMLEncode(at.value) + "'>" + HTMLEncode(at.text) + "</option>"
        });
        ah.append(ae);
        ah.chosen({max_selected_options: 5, search_contains: true, width: "740px"});
        A();
        X();
        f = true
    }

    function A() {
        if (s == null) {
            s = B.template("smsTableTmpl", B("#smsTableTmpl"))
        }
        cleanSmsList();
        B.tmpl("smsTableTmpl", {data: G.listMsgs}).translate().appendTo("#smslist-table");
        if (G.HAS_PHONEBOOK) {
            B(".sms-add-contact-icon").removeClass("hide")
        } else {
            B(".sms-add-contact-icon").addClass("hide")
        }
    }

    function X() {
        if (u.length == 0) {
            return false
        }
        if (s == null) {
            s = B.template("smsTableTmpl", B("#smsTableTmpl"))
        }
        B.tmpl("smsTableTmpl", {data: u}).translate().prependTo("#smslist-table")
    }

    function h() {
        var Z = [];
        var aa = Y.range((n - 1) * 5, n * 5);
        B.each(aa, function (ab, ac) {
            if (G.listMsgs[ac]) {
                Z.push(G.listMsgs[ac])
            }
        });
        n++;
        if (s == null) {
            s = B.template("smsTableTmpl", B("#smsTableTmpl"))
        }
        B.tmpl("smsTableTmpl", {data: Z}).translate().appendTo("#smslist-table");
        renderCheckbox();
        if (Z.length == 0) {
            disableBtn(B("#smslist-delete-all"));
            tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), 0)
        } else {
            enableBtn(B("#smslist-delete-all"));
            tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), 1)
        }
        if (n == 2 && window.innerHeight == B("body").height()) {
            h()
        }
        return Z
    }

    checkboxClickHandler = function (Z) {
        checkDeleteBtnStatus()
    };
    getSelectedItem = function () {
        var aa = [];
        var Z = B("#smslist-table input:checkbox:checked");
        Z.each(function (ab, ac) {
            aa.push(B(ac).val())
        });
        return aa
    };
    checkDeleteBtnStatus = function () {
        var Z = getSelectedItem().length;
        if (Z == 0) {
            disableBtn(B("#smslist-delete"))
        } else {
            enableBtn(B("#smslist-delete"))
        }
    };
    refreshClickHandler = function () {
        B("#smslist-table").empty();
        disableBtn(B("#smslist-delete"));
        disableCheckbox(B("#smslist-checkAll", "#smsListForm"));
        P();
        renderCheckbox()
    };
    deleteAllClickHandler = function () {
        showConfirm("confirm_data_delete", function () {
            showLoading("deleting");
            d.deleteAllMessages({location: "native_inbox"}, function (Z) {
                cleanSmsList();
                tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), 0);
                successOverlay()
            }, function (Z) {
                errorOverlay(Z.errorText)
            })
        })
    };
    deleteSelectClickHandler = function () {
        showConfirm("confirm_sms_delete", function () {
            showLoading("deleting");
            var ab = Z();
            d.deleteMessage({ids: ab.ids}, function (ac) {
                aa(ab);
                disableBtn(B("#smslist-delete"));
                B("#checkbox-all").removeAttr("checked");
                renderCheckbox();
                successOverlay()
            }, function (ac) {
                errorOverlay(ac.errorText)
            })
        });

        function aa(ab) {
            var ac = ab.ids;
            var ad = [];
            B.each(G.dbMsgs, function (ae, af) {
                if (B.inArray(af.id, ab.normalIds) != -1) {
                    ad.push(af.number)
                }
            });
            ad = Y.uniq(ad);
            B.each(ad, function (ae, af) {
                B("#smslist-item-" + getLastNumber(af, G.SMS_MATCH_LENGTH)).hide().remove()
            });
            B.each(ab.groups, function (ae, af) {
                B("#smslist-item-" + af).hide().remove()
            });
            synchSmsList(ad, ac)
        }

        function Z() {
            var af = [];
            var ac = [];
            var ad = [];
            var ab = [];
            var ae = getSelectedItem();
            B.each(ae, function (ag, ai) {
                var ah = B("#checkbox" + ai);
                if (ah.attr("groupid")) {
                    ab.push(ah.attr("groupid"))
                } else {
                    af.push(getLastNumber(ah.attr("number"), G.SMS_MATCH_LENGTH))
                }
            });
            B.each(G.dbMsgs, function (ag, ah) {
                if (B.inArray(getLastNumber(ah.number, G.SMS_MATCH_LENGTH), af) != -1 && (typeof ah.groupId == "undefined" || Y.isEmpty(ah.groupId + ""))) {
                    ac.push(ah.id);
                    ad.push(ah.id)
                } else {
                    if (B.inArray(ah.groupId + "", ab) != -1) {
                        ac.push(ah.id)
                    }
                }
            });
            ac = Y.uniq(ac);
            return {ids: ac, groups: ab, normalIds: ad}
        }
    };
    newMessageClickHandler = function () {
        B("#chosenUser1", "#smsChatRoom").addClass("hide");
        B("#chosenUser", "#smsChatRoom").show();
        cleanChatInput();
        H();
        B("select.chosen-select-deselect").val("").trigger("chosen:updated.chosen");
        C("chat");
        gotoBottom();
        clearChatList()
    };
    chatCancelClickHandler = function () {
        if (G.CONTENT_MODIFIED.modified) {
            var ab = "sms_to_save_draft";
            var Z = syncSelectAndChosen(B("select#chosenUserSelect"), B(".search-choice", "#chosenUserSelect_chosen"));
            var aa = !Z || Z.length == 0;
            if (aa) {
                ab = "sms_no_recipient"
            }
            if (aa) {
                showConfirm(ab, {
                    ok: function () {
                        if (!aa) {
                            F({content: B("#chat-input", "#smsChatRoom").val(), numbers: Z, isFromBack: true})
                        }
                        G.resetContentModifyValue();
                        q()
                    }, no: function () {
                        if (aa) {
                            return true
                        }
                        G.resetContentModifyValue();
                        q()
                    }
                })
            } else {
                F({content: B("#chat-input", "#smsChatRoom").val(), numbers: Z, isFromBack: true});
                G.resetContentModifyValue();
                q()
            }
            return false
        }
        q()
    };
    toOtherClickHandler = function (Z) {
        G.CONTENT_MODIFIED.checkChangMethod();
        if (G.CONTENT_MODIFIED.modified) {
            N();
            if (G.CONTENT_MODIFIED.message == "sms_to_save_draft") {
                G.CONTENT_MODIFIED.callback.ok(G.CONTENT_MODIFIED.data);
                G.resetContentModifyValue();
                window.location.hash = Z
            } else {
                showConfirm(G.CONTENT_MODIFIED.message, {
                    ok: function () {
                        G.CONTENT_MODIFIED.callback.ok(G.CONTENT_MODIFIED.data);
                        G.resetContentModifyValue();
                        window.location.hash = Z
                    }, no: function () {
                        var aa = G.CONTENT_MODIFIED.callback.no(G.CONTENT_MODIFIED.data);
                        if (!aa) {
                            window.location.hash = Z;
                            G.resetContentModifyValue()
                        }
                    }
                })
            }
            return false
        } else {
            window.location.hash = Z
        }
    };

    function q() {
        B("select.chosen-select-deselect").val("").trigger("chosen:updated.chosen");
        G.currentChatObject = null;
        B(".smslist-btns", "#smslist-main").removeClass("smsListFloatButs");
        C("list")
    }

    function C(Z) {
        if (Z == "chat") {
            B("#smslist-main").hide();
            B("#smsChatRoom").show()
        } else {
            B("#smsChatRoom").hide();
            B("#smslist-main").show()
        }
    }

    var r = null;
    addSendSmsError = function (Z) {
        if (r) {
            window.clearTimeout(r);
            r = null
        }
        B("#sendSmsErrorLi").text(B.i18n.prop(Z));
        r = addTimeout(function () {
            B("#sendSmsErrorLi").text("")
        }, 5000)
    };
    sendSmsClickHandler = function () {
        if (!v) {
            showAlert("sms_capacity_is_full_for_send");
            return
        }
        var aa = B("#chat-input", "#smsChatRoom");
        var ad = aa.val();
        if (ad == B.i18n.prop("chat_input_placehoder")) {
            aa.val("");
            ad = ""
        }
        var ac = syncSelectAndChosen(B("select#chosenUserSelect"), B(".search-choice", "#chosenUserSelect_chosen"));
        if (B.isArray(ac)) {
            ac = B.grep(ac, function (af, ae) {
                return !Y.isEmpty(af)
            })
        }
        if (!ac || ac.length == 0) {
            addSendSmsError("sms_contact_required");
            return
        }
        if (ac.length + D.nvUsed > D.nvTotal) {
            showAlert({msg: "sms_capacity_will_full_just", params: [D.nvTotal - D.nvUsed]});
            return
        }
        if (ac.length == 1) {
            G.currentChatObject = getLastNumber(ac[0], G.SMS_MATCH_LENGTH);
            showLoading("sending")
        } else {
            if (ac.length > 1) {
                showLoading("sending", "<button id='sms_cancel_sending' onclick='cancelSending()' class='btn btn-primary'>" + B.i18n.prop("sms_stop_sending") + "</button>");
                G.currentChatObject = null
            }
        }
        var Z = 0;
        var ab = ac.length;
        V = true;
        disableBtn(B("#btn-send", "#inputpanel"));
        sendSms = function () {
            if (!V) {
                hideLoading();
                return
            }
            var ae = {id: -1, number: ac[Z], content: ad, isNew: false};
            if (ab == 1) {
                B("#loading #loading_container").html("")
            }
            ab--;
            d.sendSMS({number: ae.number, message: ae.content, id: -1}, function (ag) {
                var af = getLatestMessage() || {
                    id: parseInt(G.smsMaxId, 10) + 1,
                    time: transUnixTime(B.now()),
                    number: ae.number
                };
                G.smsMaxId = af.id;
                ae.id = G.smsMaxId;
                ae.time = af.time;
                ae.tag = 2;
                ae.hasDraft = false;
                if (ac.length > 1) {
                    ae.targetName = getNameOrNumberByNumber(ae.number)
                }
                addSendMessage(ae, Z + 1 != ac.length);
                S(ae);
                e(ae);
                tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), B(".smslist-item", "#smslist-table").length);
                gotoBottom();
                if (Z + 1 == ac.length) {
                    updateChatInputWordLength();
                    enableBtn(B("#btn-send", "#inputpanel"));
                    hideLoading();
                    return
                }
                Z++;
                sendSms()
            }, function (af) {
                var ag = getLatestMessage() || {
                    id: parseInt(G.smsMaxId, 10) + 1,
                    time: transUnixTime(B.now()),
                    number: ae.number
                };
                G.smsMaxId = ag.id;
                ae.id = G.smsMaxId;
                ae.time = ag.time;
                ae.errorText = B.i18n.prop(af.errorText);
                ae.tag = 3;
                ae.target = ae.number;
                ae.hasDraft = false;
                if (ac.length > 1) {
                    ae.targetName = getNameOrNumberByNumber(ae.number)
                }
                addSendMessage(ae, Z + 1 != ac.length);
                S(ae);
                e(ae);
                tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), B(".smslist-item", "#smslist-table").length);
                gotoBottom();
                if (Z + 1 == ac.length) {
                    updateChatInputWordLength();
                    enableBtn(B("#btn-send", "#inputpanel"));
                    hideLoading();
                    return
                }
                Z++;
                sendSms()
            })
        };
        sendSms()
    };
    var V = true;
    cancelSending = function () {
        V = false;
        B("#loading #loading_container").html(B.i18n.prop("sms_cancel_sending"))
    };
    getLatestMessage = function () {
        var aa = d.getSMSMessages({page: 0, smsCount: 5, nMessageStoreType: 1, tags: 10, orderBy: "order by id desc"});
        if (aa.messages.length > 0) {
            for (var Z = 0; Z < aa.messages.length; Z++) {
                if (aa.messages[Z].tag == "2" || aa.messages[Z].tag == "3") {
                    return aa.messages[Z]
                }
            }
            return null
        } else {
            return null
        }
    };

    function S(aa) {
        if (G.dbMsgs.length == 0) {
            G.dbMsgs = [aa]
        } else {
            if (G.dbMsgs[0].id == aa.id) {
                G.dbMsgs[0] = aa;
                return
            } else {
                var Z = [aa];
                B.merge(Z, G.dbMsgs);
                G.dbMsgs = Z;
                return
            }
        }
    }

    function e(ab, ac, Z) {
        if ((!ab || !ab.number) && !ac) {
            return
        }
        var ag = "";
        if (ab && typeof ab.groupId != "undefined" && ab.groupId != "") {
            ag = ab.groupId
        } else {
            ag = getLastNumber((ac || ab.number), G.SMS_MATCH_LENGTH)
        }
        var ai = B("#smslist-item-" + ag);
        if (ai && ai.length > 0) {
            var aa = ai.find(".smslist-item-total-count");
            var ae = aa.text();
            ae = Number(ae.substring(1, ae.length - 1));
            if (ac) {
                if (ae == 1 || ab == null) {
                    ai.hide().remove();
                    return
                } else {
                    aa.text("(" + (ae - (Z || 1)) + ")");
                    ai.find(".smslist-item-draft-flag").addClass("hide")
                }
            } else {
                aa.text("(" + (ae + 1) + ")");
                if (ab.tag == "4") {
                    ai.find(".smslist-item-draft-flag").removeClass("hide")
                }
            }
            ai.find(".smslist-item-checkbox p.checkbox").attr("id", ab.id);
            ai.find(".smslist-item-checkbox input:checkbox").val(ab.id).attr("id", "checkbox" + ab.id);
            var af = ab.content;
            var ad;
            if (ab.tag == "4") {
                ad = ai.find(".smslist-item-msg").html('<span class="smslist-item-draft-flag colorRed" data-trans="draft"></span>: ' + HTMLEncode(af))
            } else {
                ad = ai.find(".smslist-item-msg").html(HTMLEncode(af))
            }
            ad.closest("td").prop("title", ab.content);
            ai.find(".smslist-item-repeat span").die().click(function () {
                forwardClickHandler(ab.id)
            });
            ai.find("span.clock-time").text(ab.time);
            var ah = ai;
            ai.hide().remove();
            B("#smslist-table").prepend(ah.show())
        } else {
            if (s == null) {
                s = B.template("smsTableTmpl", B("#smsTableTmpl"))
            }
            ab.checked = false;
            ab.newCount = 0;
            ab.latestId = ab.id;
            ab.latestSms = ab.content;
            ab.latestTime = ab.time;
            if (ab.groupId == "" || typeof ab.groupId == "undefined") {
                ab.totalCount = 1
            }
            if (!ab.hasDraft) {
                ab.hasDraft = false
            }
            ab.itemId = ag;
            ab.name = getNameByNumber(ab.number);
            B.tmpl("smsTableTmpl", {data: [ab]}).translate().prependTo("#smslist-table")
        }
        if (G.HAS_PHONEBOOK) {
            B(".sms-add-contact-icon").removeClass("hide")
        } else {
            B(".sms-add-contact-icon").addClass("hide")
        }
        B("#smslist-table").translate();
        renderCheckbox()
    }

    addSendMessage = function (Z, aa) {
        if (c == null) {
            c = B.template("smsMeTmpl", B("#smsMeTmpl"))
        }
        B.tmpl("smsMeTmpl", Z).appendTo("#chatlist");
        B("#chatlist").translate();
        if (!aa) {
            cleanChatInput()
        }
        clearMySmsErrorMessage(Z.id)
    };
    clearMySmsErrorMessage = function (Z) {
        addTimeout(function () {
            B("div.error", "#talk-item-" + Z).text("")
        }, 3000)
    };
    var p = false;
    hidePopup = function () {
        B(".tagPopup").remove();
        p = false
    };
    clearChatList = function () {
        B("#chatlist").empty();
        updateChatInputWordLength()
    };
    dealContent = function (Z) {
        if (G.HAS_PHONEBOOK) {
            return HTMLEncode(Z).replace(/(\d{3,})/g, function (ab) {
                var aa = (new Date().getTime() + "").substring(6) + (getRandomInt(1000) + 1000);
                return "<a id='aNumber" + aa + "' href='javascript:openPhoneBook(\"" + aa + '", "' + ab + "\")'>" + ab + "</a>"
            })
        } else {
            return HTMLEncode(Z)
        }
    };
    openPhoneBook = function (Z, ad) {
        var ag = null;
        var af = "";
        var ae = null;
        var ac = false;
        if (!Z) {
            ag = B("#listNumber" + getLastNumber(ad, G.SMS_MATCH_LENGTH));
            af = ".smslist-item";
            ae = B("#addPhonebookContainer")
        } else {
            ag = B("#aNumber" + Z);
            af = ".msg_container";
            ae = B("#chatlist");
            ac = true
        }
        if (p) {
            hidePopup()
        }
        p = true;
        B("#tagPopup").remove();
        if (Q == null) {
            Q = B.template("addPhonebookTmpl", B("#addPhonebookTmpl"))
        }
        B.tmpl("addPhonebookTmpl", {number: ad}).appendTo(ae);
        var aa = ag.position();
        var am = ag.closest(af);
        var ab = am.position();
        var al = 0, aj = 0;
        if (ac) {
            var ah = ae.width();
            var ak = ae.height();
            var ai = B("#innerTagPopup");
            al = ab.left + aa.left;
            aj = ab.top + aa.top + 20;
            if (ai.width() + al > ah) {
                al = ah - ai.width() - 20
            }
            if (ak > 100 && ai.height() + aj > ak) {
                aj = ak - ai.height() - 5
            }
        } else {
            al = aa.left;
            aj = aa.top
        }
        B("#innerTagPopup").css({top: aj + "px", left: al + "px"});
        B("#quickSaveContactForm").translate().validate({
            submitHandler: function () {
                quickSaveContact(ac)
            }, rules: {name: "name_check", number: "phonenumber_check"}
        })
    };
    quickSaveContact = function () {
        var Z = B(".tagPopup #innerTagPopup #name").val();
        var ac = B(".tagPopup #innerTagPopup #number").val();
        var ab = {
            index: -1,
            location: 1,
            name: Z,
            mobile_phone_number: ac,
            home_phone_number: "",
            office_phone_number: "",
            mail: ""
        };
        var aa = d.getDevicePhoneBookCapacity();
        if (aa.pcPbmUsedCapacity >= aa.pcPbmTotalCapacity) {
            showAlert("device_full");
            return false
        }
        showLoading("waiting");
        d.savePhoneBook(ab, function (ad) {
            if (ad.result == "success") {
                G.phonebook.push({pbm_name: Z, pbm_number: ac});
                t(Z, ac);
                hidePopup();
                successOverlay()
            } else {
                errorOverlay()
            }
        }, function (ad) {
            errorOverlay()
        })
    };

    function t(aa, ab) {
        var Z = getLastNumber(ab, G.SMS_MATCH_LENGTH);
        B("span.smslist-item-name2", "#smslist-item-" + Z).text(aa);
        B("#listNumber" + Z).hide()
    }

    deleteSingleItemClickHandler = function (ab, Z) {
        if (Z) {
            aa(ab)
        } else {
            showConfirm("confirm_sms_delete", function () {
                showLoading("deleting");
                aa(ab)
            })
        }

        function aa(ac) {
            d.deleteMessage({ids: [ac]}, function (ad) {
                var ae = B(".smslist-item-delete", "#talk-item-" + ac).attr("target");
                B("#talk-item-" + ac).hide().remove();
                synchSmsList(null, [ac]);
                e(getPeopleLatestMsg(ae), ae);
                if (Z) {
                    Z()
                } else {
                    hideLoading()
                }
                tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), B(".smslist-item", "#smslist-table").length)
            }, function (ad) {
                if (Z) {
                    Z()
                } else {
                    hideLoading()
                }
            })
        }
    };

    function g(aa, Z) {
        z();
        d.deleteMessage({ids: aa}, function (ac) {
            j(null, function () {
                N();
                U()
            });
            for (var ab = 0; ab < Z.length; ab++) {
                e(getPeopleLatestMsg(Z[ab]), Z[ab], aa.length)
            }
            synchSmsList(null, aa);
            tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), B(".smslist-item", "#smslist-table").length)
        }, function (ab) {
            U()
        })
    }

    function J(aa, Z) {
        d.deleteMessage({ids: aa}, function (ab) {
            synchSmsList(null, aa);
            B("#smslist-item-" + Z).hide().remove();
            H();
            tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), B(".smslist-item", "#smslist-table").length)
        }, function (ab) {
        })
    }

    getCurrentChatObject = function () {
        var Z = B("select.chosen-select-deselect").val();
        if (!Z) {
            G.currentChatObject = null
        } else {
            if (Z.length == 1) {
                G.currentChatObject = getLastNumber(Z, G.SMS_MATCH_LENGTH)
            } else {
                if (Z.length > 1) {
                    G.currentChatObject = null
                }
            }
        }
        return G.currentChatObject
    };
    getPeopleLatestMsg = function (aa) {
        for (var Z = 0; Z < G.dbMsgs.length; Z++) {
            if (!G.dbMsgs[Z].groupId && getLastNumber(G.dbMsgs[Z].number, G.SMS_MATCH_LENGTH) == getLastNumber(aa, G.SMS_MATCH_LENGTH)) {
                return G.dbMsgs[Z]
            }
        }
        return null
    };
    resendClickHandler = function (ad) {
        if (!v) {
            showAlert("sms_capacity_is_full_for_send");
            return
        }
        showLoading("sending");
        B("div.error", "#talk-item-" + ad).text(B.i18n.prop("sms_resending"));
        var ac = B("div.smslist-item-resend", "#talk-item-" + ad).attr("target");
        var ab = B("div.J_content", "#talk-item-" + ad).text();
        for (var aa = 0; aa < G.dbMsgs.length; aa++) {
            if (G.dbMsgs[aa].id == ad) {
                ab = G.dbMsgs[aa].content
            }
        }
        disableBtn(B("#btn-send", "#inputpanel"));
        var Z = {id: -1, number: ac, content: ab, isNew: false};
        d.sendSMS({number: Z.number, message: Z.content, id: -1}, function (af) {
            var ae = getLatestMessage() || {
                id: parseInt(G.smsMaxId, 10) + 1,
                time: transUnixTime(B.now()),
                number: Z.number
            };
            G.smsMaxId = ae.id;
            Z.id = G.smsMaxId;
            Z.time = ae.time;
            Z.tag = 2;
            Z.target = ae.number;
            Z.targetName = getNameOrNumberByNumber(ac);
            S(Z);
            e(Z);
            deleteSingleItemClickHandler(ad, function () {
                addSendMessage(Z, true);
                updateChatInputWordLength();
                enableBtn(B("#btn-send", "#inputpanel"));
                hideLoading();
                gotoBottom()
            })
        }, function (ae) {
            var af = getLatestMessage() || {
                id: parseInt(G.smsMaxId, 10) + 1,
                time: transUnixTime(B.now()),
                number: Z.number
            };
            G.smsMaxId = af.id;
            Z.id = G.smsMaxId;
            Z.time = af.time;
            Z.errorText = B.i18n.prop("sms_resend_fail");
            Z.tag = 3;
            Z.target = af.number;
            Z.targetName = getNameOrNumberByNumber(ac);
            S(Z);
            e(Z);
            deleteSingleItemClickHandler(ad, function () {
                addSendMessage(Z, true);
                updateChatInputWordLength();
                enableBtn(B("#btn-send", "#inputpanel"));
                hideLoading();
                gotoBottom()
            })
        })
    };
    gotoBottom = function () {
        B("#chatpanel .clear-container").animate({scrollTop: B("#chatlist").height()})
    };
    var L = 0;
    var W = false;

    function o() {
        n = 1;
        f = false;
        shownMsgs = [];
        W = false;
        L = 0;
        m = u = [];
        i = {};
        G.dbMsgs = [];
        G.listMsgs = null;
        G.smsMaxId = 0;
        G.phonebook = []
    }

    function I() {
        showLoading("waiting");
        G.currentChatObject = null;
        var Z = function () {
            d.getSMSReady({}, function (ac) {
                if (ac.sms_cmd_status_result == "2") {
                    B("input:button", "#smsListForm .smslist-btns").attr("disabled", "disabled");
                    hideLoading();
                    showAlert("sms_init_fail")
                } else {
                    if (ac.sms_cmd_status_result == "1") {
                        addTimeout(Z, 1000)
                    } else {
                        if (G.HAS_PHONEBOOK) {
                            ab()
                        } else {
                            aa(false)
                        }
                    }
                }
            })
        };
        var ab = function () {
            d.getPhoneBookReady({}, function (ac) {
                if (ac.pbm_init_flag == "6") {
                    aa(false)
                } else {
                    if (ac.pbm_init_flag != "0") {
                        addTimeout(ab, 1000)
                    } else {
                        aa(true)
                    }
                }
            })
        };
        var aa = function (ac) {
            o();
            if (ac) {
                R(function () {
                    M();
                    hideLoading()
                })
            } else {
                R(function () {
                    G.phonebook = [];
                    E();
                    hideLoading()
                })
            }
            bindingEvents();
            a();
            window.scrollTo(0, 0);
            y()
        };
        Z()
    }

    function y() {
        var Z = B("#smsCapability");
        j(Z);
        b();
        addInterval(function () {
            j(Z);
            b()
        }, 5000)
    }

    function b() {
        var Z = d.getStatusInfo();
        if (Z.simStatus != "modem_init_complete") {
            disableBtn(B("#btn-send"));
            B("#sendSmsErrorLi").html('<span data-trans="no_sim_card_message">' + B.i18n.prop("no_sim_card_message") + "</span>");
            B("#chatpanel .smslist-item-resend:visible").hide()
        } else {
            enableBtn(B("#btn-send"));
            B("#chatpanel .smslist-item-resend:hidden").show()
        }
    }

    function j(Z, aa) {
        d.getSmsCapability({}, function (ab) {
            if (Z != null) {
                Z.text("(" + (ab.nvUsed > ab.nvTotal ? ab.nvTotal : ab.nvUsed) + "/" + ab.nvTotal + ")")
            }
            v = ab.nvUsed < ab.nvTotal;
            D = ab;
            if (B.isFunction(aa)) {
                aa()
            }
        })
    }

    function P() {
        I()
    }

    bindingEvents = function () {
        var ab = B(window);
        var aa = B("#smslist-main .smslist-btns");
        var Z = B("#mainContainer").offset().top;
        ab.unbind("scroll").scroll(function () {
            if (ab.scrollTop() > Z) {
                aa.addClass("smsListFloatButs marginnone")
            } else {
                aa.removeClass("smsListFloatButs marginnone")
            }
        });
        B("#smslist-table p.checkbox").die().live("click", function () {
            checkboxClickHandler(B(this).attr("id"))
        });
        B("#smslist-checkAll", "#smsListForm").die().live("click", function () {
            checkDeleteBtnStatus()
        });
        B("#chat-input", "#smsChatRoom").die().live("drop", function () {
            B("#inputpanel .chatform").addClass("chatformfocus");
            var ac = B(this);
            ac.removeAttr("data-trans");
            if (ac.val() == B.i18n.prop("chat_input_placehoder")) {
                ac.val("")
            }
            updateChatInputWordLength()
        }).live("focusin", function () {
            B("#inputpanel .chatform").addClass("chatformfocus");
            var ac = B(this);
            ac.removeAttr("data-trans");
            if (ac.val() == B.i18n.prop("chat_input_placehoder")) {
                ac.val("")
            }
            updateChatInputWordLength()
        }).live("focusout", function () {
            B("#inputpanel .chatform").removeClass("chatformfocus");
            var ac = B(this);
            if (ac.val() == "" || ac.val() == B.i18n.prop("chat_input_placehoder")) {
                ac.val(B.i18n.prop("chat_input_placehoder")).attr("data-trans", "chat_input_placehoder")
            }
            updateChatInputWordLength()
        }).live("keyup", function () {
            updateChatInputWordLength()
        }).live("paste", function () {
            window.setTimeout(function () {
                updateChatInputWordLength()
            }, 0)
        }).live("cut", function () {
            window.setTimeout(function () {
                updateChatInputWordLength()
            }, 0)
        }).live("drop", function () {
            window.setTimeout(function () {
                updateChatInputWordLength()
            }, 0)
        }).live("contextmenu", function () {
            return false
        });
        B("#name").die().live("drop", function () {
            updateNameInputWordLength()
        }).live("focusin", function () {
            updateNameInputWordLength()
        }).live("focusout", function () {
            updateNameInputWordLength()
        }).live("keyup", function () {
            updateNameInputWordLength()
        }).live("paste", function () {
            updateNameInputWordLength()
        }).live("cut", function () {
            updateNameInputWordLength()
        }).live("dragend", function () {
            updateNameInputWordLength()
        }).live("contextmenu", function () {
            return false
        });
        B("select.chosen-select-deselect", "#smsChatRoom").die().live("change", function () {
            N()
        });
        B("#searchInput").die().live("blur", function () {
            searchTextBlur()
        }).live("keyup", function () {
            updateSearchValue(B("#searchInput").val())
        })
    };
    updateNameInputWordLength = function () {
        var ab = B("#name", "#quickSaveContactForm");
        var ac = ab[0];
        var ad = ab.val();
        var aa = getEncodeType(ad);
        var Z = aa.encodeType == "UNICODE" ? 11 : 22;
        while (ad.length + aa.extendLen > Z) {
            ad = ad.substring(0, ad.length - 1);
            ac.value = ad;
            aa = getEncodeType(ad);
            Z = aa.encodeType == "UNICODE" ? 11 : 22
        }
    };
    getNameByNumber = function (Z) {
        for (var aa = G.phonebook.length; aa > 0; aa--) {
            if (getLastNumber(G.phonebook[aa - 1].pbm_number, G.SMS_MATCH_LENGTH) == getLastNumber(Z, G.SMS_MATCH_LENGTH)) {
                return G.phonebook[aa - 1].pbm_name
            }
        }
        return ""
    };
    getShowNameByNumber = function (Z) {
        for (var aa = G.phonebook.length; aa > 0; aa--) {
            if (getLastNumber(G.phonebook[aa - 1].pbm_number, G.SMS_MATCH_LENGTH) == getLastNumber(Z, G.SMS_MATCH_LENGTH)) {
                return G.phonebook[aa - 1].pbm_name
            }
        }
        return Z
    };
    getNameOrNumberByNumber = function (Z) {
        for (var aa = G.phonebook.length; aa > 0; aa--) {
            if (G.phonebook[aa - 1].pbm_number == Z) {
                return G.phonebook[aa - 1].pbm_name
            }
        }
        for (var aa = G.phonebook.length; aa > 0; aa--) {
            if (getLastNumber(G.phonebook[aa - 1].pbm_number, G.SMS_MATCH_LENGTH) == getLastNumber(Z, G.SMS_MATCH_LENGTH)) {
                return G.phonebook[aa - 1].pbm_name
            }
        }
        return Z
    };
    smsItemClickHandler = function (ai) {
        if (O) {
            return false
        }
        O = true;
        if (x == null) {
            x = B.template("smsOtherTmpl", B("#smsOtherTmpl"))
        }
        if (c == null) {
            c = B.template("smsMeTmpl", B("#smsMeTmpl"))
        }
        var Z = getShowNameByNumber(ai);
        B("#chosenUser", "#smsChatRoom").hide();
        B("#chosenUser1", "#smsChatRoom").addClass("hide");
        G.currentChatObject = getLastNumber(ai, G.SMS_MATCH_LENGTH);
        setAsRead(ai);
        cleanChatInput();
        clearChatList();
        var ah = B("select.chosen-select-deselect", "#smsChatRoom");
        var ac = B("option", ah);
        var aa = false;
        for (var ag = 0; ag < ac.length; ag++) {
            var ad = ac[ag];
            if (getLastNumber(ad.value, G.SMS_MATCH_LENGTH) == G.currentChatObject) {
                ai = ad.value;
                aa = true;
                break
            }
        }
        if (!aa) {
            ah.append("<option value='" + HTMLEncode(ai) + "' selected='selected'>" + HTMLEncode(ai) + "</option>")
        }
        B("select.chosen-select-deselect").val(ai).trigger("chosen:updated.chosen");
        C("chat");
        G.dbMsgs = Y.sortBy(G.dbMsgs, function (al) {
            return 0 - al.id
        });
        var aj = [];
        var ab = [];
        var ae = [];
        var af = false;
        for (var ag = G.dbMsgs.length - 1; ag >= 0; ag--) {
            var ak = G.dbMsgs[ag];
            if (Y.indexOf(ae, ak.id) != -1) {
                continue
            }
            if (getLastNumber(ak.number, G.SMS_MATCH_LENGTH) == G.currentChatObject && Y.isEmpty(ak.groupId)) {
                ak.isNew = false;
                ak.errorText = "";
                ak.targetName = "";
                if (ak.tag == "0" || ak.tag == "1") {
                    B.tmpl("smsOtherTmpl", ak).appendTo("#chatlist");
                    ae.push(ak.id);
                    ab.push(ak)
                } else {
                    if (ak.tag == "2" || ak.tag == "3") {
                        B.tmpl("smsMeTmpl", ak).appendTo("#chatlist");
                        ae.push(ak.id);
                        ab.push(ak)
                    } else {
                        if (ak.tag == "4") {
                            aj.push(ak.id);
                            B("#chat-input", "#smsChatRoom").val(ak.content).removeAttr("data-trans");
                            updateChatInputWordLength();
                            af = true
                        }
                    }
                }
            } else {
                ae.push(ak.id);
                ab.push(ak)
            }
        }
        B("#chatlist").translate();
        if (af) {
            B("#chosenUser", "#smsChatRoom").show();
            B("#chosenUser1", "#smsChatRoom").addClass("hide")
        } else {
            B("#chosenUser", "#smsChatRoom").hide();
            B("#chosenUser1", "#smsChatRoom").removeClass("hide").html(HTMLEncode(Z))
        }
        G.dbMsgs = ab.reverse();
        if (aj.length > 0) {
            g(aj, [ai])
        } else {
            H()
        }
        b();
        gotoBottom();
        O = false
    };

    function H() {
        var Z = B("#smsCapability");
        j(Z);
        addTimeout(function () {
            if (!v) {
                showAlert("sms_capacity_is_full_for_send")
            }
        }, 2000)
    }

    cleanChatInput = function () {
        B("#chat-input", "#smsChatRoom").val(B.i18n.prop("chat_input_placehoder")).attr("data-trans", "chat_input_placehoder")
    };
    setAsRead = function (Z) {
        var aa = [];
        B.each(G.dbMsgs, function (ab, ac) {
            if (getLastNumber(ac.number, G.SMS_MATCH_LENGTH) == getLastNumber(Z, G.SMS_MATCH_LENGTH) && ac.isNew) {
                aa.push(ac.id);
                ac.isNew = false
            }
        });
        if (aa.length > 0) {
            d.setSmsRead({ids: aa}, function (ab) {
                if (ab.result) {
                    B("#smslist-item-" + getLastNumber(Z, G.SMS_MATCH_LENGTH) + " .smslist-item-new-count").text("").addClass("hide");
                    B("#smslist-item-" + getLastNumber(Z, G.SMS_MATCH_LENGTH)).removeClass("font-weight-bold");
                    B("#smslist-item-" + getLastNumber(Z, G.SMS_MATCH_LENGTH) + " td:nth-child(2)").removeClass("font-weight-bold")
                }
                B.each(G.listMsgs, function (ac, ad) {
                    if (ad.number == Z && ad.newCount > 0) {
                        ad.newCount = 0
                    }
                })
            })
        }
    };
    forwardClickHandler = function (ae) {
        var ad = syncSelectAndChosen(B("select#chosenUserSelect"), B(".search-choice", "#chosenUserSelect_chosen"));
        var ac = B("#chat-input", "#smsChatRoom").val();
        var aa = typeof ac != "undefined" && ac != "" && ac != B.i18n.prop("chat_input_placehoder");
        if (aa) {
            F({content: ac, numbers: ad, isFromBack: true, noLoading: true})
        }
        clearChatList();
        G.currentChatObject = null;
        B("#chosenUser1", "#smsChatRoom").addClass("hide");
        B("#chosenUser", "#smsChatRoom").show();
        for (var ab = 0; ab < G.dbMsgs.length; ab++) {
            if (G.dbMsgs[ab].id == ae) {
                var Z = B("#chat-input", "#smsChatRoom");
                Z.val(G.dbMsgs[ab].content);
                setInsertPos(Z[0], G.dbMsgs[ab].content.length)
            }
        }
        updateChatInputWordLength();
        B("select.chosen-select-deselect").val("").trigger("chosen:updated.chosen");
        addTimeout(function () {
            B("#chosen-search-field-input").focus()
        }, 300);
        C("chat");
        gotoBottom()
    };
    updateChatInputWordLength = function () {
        var an = B("#chat-input", "#smsChatRoom");
        var al = an[0];
        var ap = an.val();
        var ar = getEncodeType(ap);
        var af = ar.encodeType == "UNICODE" ? 335 : 765;
        if (ap.length + ar.extendLen > af) {
            var aa = al.scrollTop;
            var Z = getInsertPos(al);
            var ai = ap.length + ar.extendLen - af;
            var ae = ap.substr(Z - ai > 0 ? Z - ai : 0, ai);
            var ab = ae.split("").reverse();
            var ak = 0;
            var ad = 0;
            for (var am = 0; am < ab.length; am++) {
                if (getEncodeType(ab[am]).extendLen > 0) {
                    ak += 2
                } else {
                    ak++
                }
                if (ak >= ai) {
                    ad = am + 1;
                    break
                }
            }
            var aq = Z - ad;
            al.value = ap.substr(0, aq) + ap.substr(Z);
            if (al.value.length > af) {
                al.value = al.value.substr(0, af)
            }
            setInsertPos(al, aq);
            al.scrollTop = aa
        }
        var aj = 0;
        var ah = B(al).val();
        var at = {encodeType: "GSM7_default", extendLen: 0};
        if (ah != B.i18n.prop("chat_input_placehoder")) {
            at = getEncodeType(ah)
        }
        var ao = at.encodeType == "UNICODE" ? 335 : 765;
        var ac = B("#inputcount", "#inputpanel");
        var ag = B("#inputItemCount", "#inputpanel");
        if (ah.length + at.extendLen >= ao) {
            ac.addClass("colorRed");
            ag.addClass("colorRed")
        } else {
            B("#inputcount", "#inputpanel").removeClass("colorRed");
            B("#inputItemCount", "#inputpanel").removeClass("colorRed")
        }
        if ("" != ah && B.i18n.prop("chat_input_placehoder") != ah) {
            aj = ah.length + at.extendLen
        }
        ac.html("(" + aj + "/" + ao + ")");
        ag.html("(" + getSmsCount(ah) + "/5)");
        N()
    };

    function N() {
        var aa = B("#chat-input", "#smsChatRoom").val();
        if (v) {
            var ab = getSelectValFromChosen(B(".search-choice", "#chosenUserSelect_chosen"));
            var ac = !ab || ab.length == 0;
            var Z = typeof aa != "undefined" && aa != "" && aa != B.i18n.prop("chat_input_placehoder");
            if (!Z) {
                G.resetContentModifyValue();
                return
            }
            if (Z && !ac) {
                G.CONTENT_MODIFIED.modified = true;
                G.CONTENT_MODIFIED.message = "sms_to_save_draft";
                G.CONTENT_MODIFIED.callback.ok = F;
                G.CONTENT_MODIFIED.callback.no = B.noop;
                G.CONTENT_MODIFIED.data = {content: B("#chat-input", "#smsChatRoom").val(), numbers: ab};
                return
            }
            if (Z && ac) {
                G.CONTENT_MODIFIED.modified = true;
                G.CONTENT_MODIFIED.message = "sms_no_recipient";
                G.CONTENT_MODIFIED.callback.ok = B.noop;
                G.CONTENT_MODIFIED.callback.no = function () {
                    return true
                };
                return
            }
        } else {
            G.resetContentModifyValue()
        }
    }

    function F(aa) {
        var ac = new Date();
        var ab = {
            index: -1,
            currentTimeString: getCurrentTimeString(ac),
            groupId: aa.numbers.length > 1 ? ac.getTime() : "",
            message: aa.content,
            numbers: aa.numbers
        };
        !aa.noLoading && showLoading("waiting");
        d.saveSMS(ab, function () {
            if (aa.isFromBack) {
                Z(aa.numbers);
                !aa.noLoading && successOverlay("sms_save_draft_success")
            } else {
                !aa.noLoading && successOverlay("sms_save_draft_success")
            }
        }, function () {
            !aa.noLoading && errorOverlay("sms_save_draft_failed")
        });

        function Z(ad) {
            d.getSMSMessages({
                page: 0,
                smsCount: 5,
                nMessageStoreType: 1,
                tags: 4,
                orderBy: "order by id desc"
            }, function (aj) {
                if (aj.messages && aj.messages.length > 0) {
                    var ai = "", ak = "", ae = "", al = 0, ag = [];
                    for (; al < aj.messages.length; al++) {
                        var af = aj.messages[al];
                        for (var ah = 0; ah < ad.length; ah++) {
                            var am = ad[ah];
                            if (getLastNumber(am, G.SMS_MATCH_LENGTH) == getLastNumber(af.number, G.SMS_MATCH_LENGTH)) {
                                af.number = am
                            }
                        }
                        if (ai != "" && ai != af.groupId) {
                            break
                        }
                        S(af);
                        if (af.groupId == "") {
                            break
                        } else {
                            ai = af.groupId;
                            var ao = getShowNameByNumber(af.number);
                            ak += (al == 0 ? "" : ";") + ao;
                            ae += (al == 0 ? "" : ";") + ao
                        }
                        ag.push(af)
                    }
                    if (ai == "") {
                        var af = aj.messages[0];
                        af.hasDraft = true;
                        e(af)
                    } else {
                        var af = aj.messages[0];
                        var an = 10;
                        if (getEncodeType(ak).encodeType == "UNICODE") {
                            an = 10
                        }
                        af.draftShowNameTitle = ae;
                        af.draftShowName = ak.length > an ? ak.substring(0, an) + "..." : ak;
                        af.hasDraft = true;
                        af.totalCount = al;
                        i[ai] = ag;
                        e(af)
                    }
                    tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), B(".smslist-item", "#smslist-table").length)
                }
            }, function () {
            })
        }
    }

    draftSmsItemClickHandler = function (ab) {
        if (O) {
            return false
        }
        O = true;
        var ad = i[ab];
        var Z = [];
        var ac = [];
        for (var aa = 0; ad && aa < ad.length; aa++) {
            Z.push(getLastNumber(ad[aa].number, G.SMS_MATCH_LENGTH));
            ac.push(ad[aa].id + "")
        }
        B("#chosenUser", "#smsChatRoom").show();
        B("#chosenUser1", "#smsChatRoom").addClass("hide").html("");
        B("select.chosen-select-deselect").val(Z).trigger("chosen:updated.chosen");
        B("#chat-input", "#smsChatRoom").val(ad[0].content);
        updateChatInputWordLength();
        clearChatList();
        C("chat");
        N();
        gotoBottom();
        O = false;
        J(ac, ab)
    };
    deletePhoneMessageClickHandler = function (Z) {
        showConfirm("confirm_sms_delete", function () {
            showLoading("deleting");
            var aa = [];
            B.each(G.dbMsgs, function (ab, ac) {
                if (ac.number == Z) {
                    aa.push(ac.id)
                }
            });
            d.deleteMessage({ids: aa}, function (ab) {
                B("#smslist-item-" + getLastNumber(Z, G.SMS_MATCH_LENGTH)).hide().remove();
                synchSmsList([Z], aa);
                successOverlay();
                tryToDisableCheckAll(B("#smslist-checkAll", "#smsListForm"), B(".smslist-item", "#smslist-table").length)
            }, function (ab) {
                errorOverlay(ab.errorText)
            })
        })
    };
    synchSmsList = function (ab, Z) {
        if (ab && ab.length > 0) {
            G.listMsgs = B.grep(G.listMsgs, function (ad, ac) {
                return B.inArray(ad.number, ab) == -1
            })
        }
        if (Z && Z.length > 0) {
            var aa = [];
            B.each(G.dbMsgs, function (ac, ad) {
                if (B.inArray(ad.id, Z) == -1) {
                    aa.push(ad)
                }
            });
            G.dbMsgs = aa
        }
    };

    function a() {
        var aa = B(".smslist-item");
        var Z;
        if (aa.length > 0) {
            Z = aa[aa.length - 1]
        } else {
            Z = aa[0]
        }
        L = Z ? Z.offsetTop : 600
    }

    function l() {
        if (f && !W && L < (B(window).scrollTop() + B(window).height()) && B(".smslist-item").length != G.listMsgs.length) {
            W = true;
            addTimeout(function () {
                removeChecked("smslist-checkAll");
                h();
                a();
                W = false
            }, 100)
        }
    }

    function z() {
        disableBtn(B("#btn-back"));
        B("a", "#left").bind("click", function () {
            return false
        });
        B("a", "#list-nav").bind("click", function () {
            return false
        })
    }

    function U() {
        enableBtn(B("#btn-back"));
        B("a", "#left").unbind("click");
        B("a", "#list-nav").unbind("click")
    }

    function w(ab) {
        ab = B.trim(ab);
        var aa = B("tr", "#smslist-table"), ae = aa.length;
        if (ab == "") {
            aa.show();
            return false
        }
        aa.hide();
        while (ae) {
            var ac = B(aa[ae - 1]), ad = B("td", ac), Z = ad.length;
            while (Z - 1) {
                var af = B(ad[Z - 1]);
                if (af.text().toLowerCase().indexOf(ab.toLowerCase()) != -1) {
                    ac.show();
                    break
                }
                Z--
            }
            ae--
        }
        addTimeout(function () {
            B(":checkbox:checked", "#addPhonebookContainer").removeAttr("checked");
            vm.selectedItemIds([]);
            vm.freshStatus(B.now());
            renderCheckbox()
        }, 300);
        return true
    }

    updateSearchValue = function (Z) {
        if (Z == "" || Z == B.i18n.prop("search")) {
            return true
        }
        w(Z)
    };
    clearSearchKey = function () {
        updateSearchValue(B.i18n.prop("search"));
        B("#searchInput").addClass("ko-grid-search-txt-default").attr("data-trans", "search")
    };
    searchTextClick = function () {
        var Z = B("#searchInput");
        if (Z.hasClass("ko-grid-search-txt-default")) {
            updateSearchValue("");
            Z.val("");
            Z.removeClass("ko-grid-search-txt-default").removeAttr("data-trans")
        }
    };
    searchTextBlur = function () {
        var Z = B.trim(B("#searchInput").val()).toLowerCase();
        if (Z == "") {
            clearSearchKey()
        }
    };
    window.smsUtil = {
        changeLocationHandler: function (Z) {
            if (B(Z).val() == "sim") {
                window.location.hash = "#msg_sim"
            } else {
                window.location.hash = "#msg_main"
            }
        }
    };
    return {init: P}
});
define("sms_set", "underscore jquery knockout set service".split(" "), function (f, b, i, a, d) {
    var c = f.map(a.SMS_VALIDITY, function (j) {
        return new Option(j.name, j.value)
    });

    function e() {
        var k = this;
        var j = h();
        k.modes = i.observableArray(c);
        k.selectedMode = i.observable(j.validity);
        k.centerNumber = i.observable(j.centerNumber);
        k.deliveryReport = i.observable(j.deliveryReport);
        k.clear = function () {
            g();
            clearValidateMsg()
        };
        k.save = function () {
            showLoading("waiting");
            var l = {};
            l.validity = k.selectedMode();
            l.centerNumber = k.centerNumber();
            l.deliveryReport = k.deliveryReport();
            d.setSmsSetting(l, function (m) {
                if (m.result == "success") {
                    successOverlay()
                } else {
                    errorOverlay()
                }
            })
        }
    }

    function h() {
        return d.getSmsSetting()
    }

    function g() {
        var j = b("#container");
        i.cleanNode(j[0]);
        var k = new e();
        i.applyBindings(k, j[0]);
        b("#smsSettingForm").validate({
            submitHandler: function () {
                k.save()
            }, rules: {txtCenterNumber: "sms_service_center_check"}
        })
    }

    return {init: g}
});
define("sms_sim_messages", "jquery knockout set service".split(" "), function (e, b, o, s) {
    var d = null;
    var p = 200;

    function q() {
        return s.getSMSMessages({
            page: 0,
            smsCount: p,
            nMessageStoreType: 0,
            tags: 10,
            orderBy: "order by id desc"
        }, function (t) {
            tryToDisableCheckAll(e("#simMsgList-checkAll"), t.messages.length);
            c(t.messages)
        }, function (t) {
            c([])
        })
    }

    function c(t) {
        e.each(t, function (v, x) {
            x.itemId = getLastNumber(x.number, o.SMS_MATCH_LENGTH);
            for (var w = 0; w < o.phonebook.length; w++) {
                var u = o.phonebook[w];
                if (x.itemId == getLastNumber(u.pbm_number, o.SMS_MATCH_LENGTH)) {
                    x.name = u.pbm_name;
                    break
                }
            }
        });
        h(t)
    }

    cleanSimSmsList = function () {
        e("#simMsgList_container").empty()
    };

    function h(t) {
        if (d == null) {
            d = e.template("simMsgListTmpl", e("#simMsgListTmpl"))
        }
        cleanSimSmsList();
        e("#simMsgList_container").html(e.tmpl("simMsgListTmpl", {data: t}));
        hideLoading()
    }

    function k(t) {
        s.getPhoneBooks({page: 0, data_per_page: 2000, orderBy: "name", isAsc: true}, function (u) {
            if (e.isArray(u.pbm_data) && u.pbm_data.length > 0) {
                o.phonebook = u.pbm_data
            } else {
                o.phonebook = []
            }
            t()
        }, function () {
            errorOverlay()
        })
    }

    function i() {
        var t = this;
        f()
    }

    deleteSelectedSimMsgClickHandler = function () {
        var v = e("input[name=msgId]:checked", "#simMsgList_container");
        var t = [];
        for (var u = 0; u < v.length; u++) {
            t.push(e(v[u]).val())
        }
        if (t.length == 0) {
            return false
        }
        showConfirm("confirm_sms_delete", function () {
            showLoading("deleting");
            s.deleteMessage({ids: t}, function (w) {
                removeChecked("simMsgList-checkAll");
                disableBtn(e("#simMsgList-delete"));
                var x = "";
                v.each(function (y, z) {
                    x += ".simMsgList-item-class-" + e(z).val() + ","
                });
                if (x.length > 0) {
                    e(x.substring(0, x.length - 1)).hide().remove()
                }
                tryToDisableCheckAll(e("#simMsgList-checkAll"), e(".smslist-item", "#simMsgList_container").length);
                successOverlay()
            }, function (w) {
                errorOverlay(w.errorText)
            });
            r(e("#simSmsCapability"))
        })
    };

    function m() {
        if (n() == 0) {
            disableBtn(e("#simMsgList-delete"))
        } else {
            enableBtn(e("#simMsgList-delete"))
        }
    }

    function n() {
        return e("input:checkbox:checked", "#simMsgList_container").length
    }

    function f() {
        showLoading("waiting");
        var t = function () {
            s.getSMSReady({}, function (w) {
                if (w.sms_cmd_status_result == "2") {
                    hideLoading();
                    showAlert("sms_init_fail")
                } else {
                    if (w.sms_cmd_status_result == "1") {
                        addTimeout(function () {
                            t()
                        }, 1000)
                    } else {
                        if (!o.HAS_PHONEBOOK) {
                            u(o.HAS_PHONEBOOK)
                        } else {
                            v()
                        }
                    }
                }
            })
        };
        var v = function () {
            s.getPhoneBookReady({}, function (w) {
                if (w.pbm_init_flag == "6") {
                    u(false)
                } else {
                    if (w.pbm_init_flag != "0") {
                        addTimeout(function () {
                            v()
                        }, 1000)
                    } else {
                        u(o.HAS_PHONEBOOK)
                    }
                }
            })
        };
        var u = function (w) {
            if (w) {
                k(function () {
                    q()
                })
            } else {
                o.phonebook = [];
                q()
            }
        };
        t();
        g()
    }

    function g() {
        var t = e("#simSmsCapability");
        r(t);
        addInterval(function () {
            r(t)
        }, 5000)
    }

    function r(t) {
        s.getSmsCapability({}, function (u) {
            if (t != null) {
                t.text("(" + u.simUsed + "/" + u.simTotal + ")")
            }
        })
    }

    clearSearchKey = function () {
        updateSearchValue(e.i18n.prop("search"));
        e("#searchInput").addClass("ko-grid-search-txt-default").attr("data-trans", "search")
    };
    searchTextClick = function () {
        var t = e("#searchInput");
        if (t.hasClass("ko-grid-search-txt-default")) {
            updateSearchValue("");
            t.val("");
            t.removeClass("ko-grid-search-txt-default").removeAttr("data-trans")
        }
    };
    searchTextBlur = function () {
        var t = e.trim(e("#searchInput").val()).toLowerCase();
        if (t == "") {
            clearSearchKey()
        }
    };
    updateSearchValue = function (t) {
        if (t == "" || t == e.i18n.prop("search")) {
            return true
        }
        j(t)
    };

    function j(v) {
        v = e.trim(v);
        var u = e("tr", "#smslist-table"), y = u.length;
        if (v == "") {
            u.show();
            return false
        }
        u.hide();
        while (y) {
            var w = e(u[y - 1]), x = e("td", w), t = x.length;
            while (t - 1) {
                var z = e(x[t - 1]);
                if (z.text().toLowerCase().indexOf(v.toLowerCase()) != -1) {
                    w.show();
                    break
                }
                t--
            }
            y--
        }
        addTimeout(function () {
            e(":checkbox:checked", "#addPhonebookContainer").removeAttr("checked");
            vm.selectedItemIds([]);
            vm.freshStatus(e.now());
            renderCheckbox()
        }, 300);
        return true
    }

    simsmsItemClickHandler = function (t, w, u) {
        if (t == "1") {
            var v = [];
            v.push(w);
            s.setSmsRead({ids: v}, function (x) {
                if (x.result) {
                    e(".simMsgList-item-class-" + w, "#simMsgTableContainer").removeClass("font-weight-bold")
                }
            })
        }
    };

    function a() {
        e(".smslist-item-msg", "#simMsgTableContainer").die().live("click", function () {
            var t = e(this).addClass("showFullHeight");
            e(".smslist-item-msg.showFullHeight", "#simMsgTableContainer").not(t).removeClass("showFullHeight")
        });
        e("#simMsgList_container p.checkbox, #simMsgListForm #simMsgList-checkAll").die().live("click", function () {
            m()
        });
        e("#searchInput").die().live("blur", function () {
            searchTextBlur()
        }).live("keyup", function () {
            updateSearchValue(e("#searchInput").val())
        })
    }

    function l() {
        var t = e("#container");
        b.cleanNode(t[0]);
        var u = new i();
        b.applyBindings(u, t[0]);
        a()
    }

    window.smsUtil = {
        changeLocationHandler: function (t) {
            if (e(t).val() == "sim") {
                window.location.hash = "#msg_sim"
            } else {
                window.location.hash = "#msg_main"
            }
        }
    };
    return {init: l}
});