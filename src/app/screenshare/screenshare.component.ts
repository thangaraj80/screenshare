import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import * as RTCMultiConnection from "./assets/js/RTCMultiConnection.js"
import * as DetectRTC from "./assets/DetectRTC.js";
import * as getHTMLMediaElement from "./assets/js/dev/getHTMLMediaElement";

// import *  "./assets/conference.js"

@Component({
    selector: 'app-screenshare',
    templateUrl: './screenshare.component.html',
    styleUrls: ['./screenshare.component.css']

})

export class ScreenshareComponent implements OnInit {
    @ViewChild("roomid", { static: true }) roomId: ElementRef;
    @ViewChild("roomurls", { static: true }) roomURLsDiv: ElementRef;
    navigator
    RMCMediaTrack = {
        cameraStream: null,
        cameraTrack: null,
        screen: null,
        selfVideo: null
    };

    connection;
    shareBtnDisable: boolean = true
    constructor() {

    }

    ngOnInit(): void {

        // ......................................................
        // ..................RTCMultiConnection Code.............
        // ......................................................

        this.connection = new RTCMultiConnection();

        // by default, socket.io server is assumed to be deployed on your own URL
        //  this.connection.socketURL = '/';
        // comment-out below line if you do not have your own socket.io server
        this.connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
        this.connection.socketMessageEvent = 'video-screen-demo';
        this.connection.session = {
            screen: true,
            oneway: true
            // isScreen: true
        };
        this.connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false
        };

        // https://www.rtcmulticonnection.org/docs/iceServers/
        // use your own TURN-server here!
        this.connection.iceServers = [{
            //'urls': ['https://www.rtcmulticonnection.org/docs/iceServers/']
            'urls': [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun.l.google.com:19302?transport=udp',
            ]
        }];

        this.connection.videosContainer = document.getElementById('videos-container');

        this.connection.onstream = (event) => {
            const existing = document.getElementById(event.streamid);
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }

            event.mediaElement.removeAttribute('src');
            event.mediaElement.removeAttribute('srcObject');
            event.mediaElement.muted = true;
            event.mediaElement.volume = 0;

            const video = document.createElement('video');

            try {
                video.setAttributeNode(document.createAttribute('autoplay'));
                video.setAttributeNode(document.createAttribute('playsinline'));
            } catch (e) {
                video.setAttribute('autoplay', "true");
                video.setAttribute('playsinline', "true");
            }

            if (event.type === 'local') {
                video.volume = 0;
                try {
                    video.setAttributeNode(document.createAttribute('muted'));
                } catch (e) {
                    video.setAttribute('muted', "true");
                }
            }
            video.srcObject = event.stream;

            const width = innerWidth - 80;
            const mediaElement = getHTMLMediaElement.getHTMLMediaElement(video, {
                title: event.userid,
                buttons: ['full-screen'],
                width: width,
                showOnMouseEnter: false
            });

            this.connection.videosContainer.appendChild(mediaElement);

            setTimeout(() => {
                mediaElement.media.play();
            }, 5000);

            mediaElement.id = event.streamid;
        };

        this.connection.onstreamended = (event) => {
            var mediaElement = document.getElementById(event.streamid);
            if (mediaElement) {
                mediaElement.parentNode.removeChild(mediaElement);

                if (event.userid === this.connection.sessionid && !this.connection.isInitiator) {
                    alert('Broadcast is ended. We will reload this page to clear the cache.');
                    location.reload();
                }
            }
        };

        this.connection.onMediaError = (e) => {
            if (e.message === 'Concurrent mic process limit.') {
                if (DetectRTC.audioInputDevices.length <= 1) {
                    alert('Please select external microphone. Check github issue number 483.');
                    return;
                }

                var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
                this.connection.mediaConstraints.audio = {
                    deviceId: secondaryMic
                };

                this.connection.join(this.connection.sessionid);
            }
        };
        const params: any = {},
            r = /([^&=]+)=?([^&]*)/g;

        function d(s) {
            return decodeURIComponent(s.replace(/\+/g, ' '));
        }
        var match, search = window.location.search;
        while (match = r.exec(search.substring(1)))
            params[d(match[1])] = d(match[2]);
        // window.params = params;

        let roomid = '';
        if (localStorage.getItem(this.connection.socketMessageEvent)) {
            roomid = localStorage.getItem(this.connection.socketMessageEvent);
        } else {
            roomid = this.connection.token();
        }
        this.roomId.nativeElement.value = roomid;
        this.roomId.nativeElement.onkeyup = () => {
            localStorage.setItem(this.connection.socketMessageEvent, this.roomId.nativeElement.value);
        };

        let hashString = location.hash.replace('#', '');
        if (hashString.length && hashString.indexOf('comment-') == 0) {
            hashString = '';
        }

        roomid = params.roomid;
        if (!roomid && hashString.length) {
            roomid = hashString;
        }

        if (roomid && roomid.length) {
            this.roomId.nativeElement.value = roomid;
            localStorage.setItem(this.connection.socketMessageEvent, roomid);

            // auto-join-room
            (function reCheckRoomPresence() {
                this.connection.checkPresence(roomid, (isRoomExist) => {
                    if (isRoomExist) {
                        this.connection.join(roomid);
                        return;
                    }

                    setTimeout(reCheckRoomPresence, 5000);
                });
            })();

            this.disableInputButtons();
        }

        /* detect 2G
        if (this.navigator.connection &&
            this.navigator.connection.type === 'cellular' &&
            this.navigator.connection.downlinkMax <= 0.115) {
            alert('2G is not supported. Please use a better internet service.');
        }*/
    }

    openRoom(e) {
        this.disableInputButtons();
        this.connection.open(this.roomId.nativeElement.value, () => {
            this.showRoomURL(this.connection.sessionid);
        });
    };

    joinRoom = () => {
        this.disableInputButtons();

        this.connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: true
        };
        this.connection.join(this.roomId.nativeElement.value);
    };

    openRjoinRoom = () => {
        this.disableInputButtons();
        this.connection.openOrJoin(this.roomId.nativeElement.value, (isRoomExist, roomid) => {
            if (isRoomExist === false && this.connection.isInitiator === true) {
                // if room doesn't exist, it means that current user will create the room
                this.showRoomURL(roomid);
            }

            if (isRoomExist) {
                this.connection.sdpConstraints.mandatory = {
                    OfferToReceiveAudio: false,
                    OfferToReceiveVideo: true
                };
            }
        });
    };

    showRoomURL = (roomid) => {
        const roomHashURL = '#' + roomid;
        const roomQueryStringURL = '?roomid=' + roomid;
        let html = '<h2>Unique URL for your room:</h2><br>';
        html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
        html += '<br>';
        html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
        const roomURLsDiv = document.getElementById('room-urls');
        this.roomURLsDiv.nativeElement.innerHTML = html;
        this.roomURLsDiv.nativeElement.style.display = 'block';
    }
    disableInputButtons = () => {
        /* document.getElementById('room-id').onkeyup();
         document.getElementById('open-or-join-room').disabled = true;
         document.getElementById('open-room').disabled = true;
         document.getElementById('join-room').disabled = true;
         document.getElementById('room-id').disabled = true;*/
    }

}