/**
 * Copyright 2014, 2015 Andrew D Lindsay @AndrewDLindsay
 * http://blog.thiseldo.co.uk
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var Youtube = require("youtube-api");

    function GoogleAPINode(n) {
        RED.nodes.createNode(this,n);
        if (this.credentials &&
            this.credentials.apikey) {
            this.YoutubeAPI = require("youtube-api");
            this.YoutubeAPI.authenticate({
                type: "key",
                key: this.credentials.apikey
            });
        }
    }

    RED.nodes.registerType("google-config",GoogleAPINode,{
        credentials: {
            apikey: { type: "password" }
        }
    });


    function YouTubePlayListList(n) {
        RED.nodes.createNode(this,n);
        this.apiConfig = RED.nodes.getNode(n.apikey);
        this.part = n.part;
        this.playlistid = n.playlistid || "";
        var node = this;
        var YoutubeAPI = this.apiConfig ? this.apiConfig.YoutubeAPI : null;

	if (!YoutubeAPI) {
            node.warn("Missing Google credentials");
            return;
        }

        node.status({fill:"blue",shape:"dot",text:"initializing"});

        YoutubeAPI.playlistItems.list({ part: node.part, playlistId: node.playlistid }, function(err, data) {
            if (err) {
                node.error("failed to fetch YouTube Playlist : " + err);
                node.status({fill:"red",shape:"ring",text:"error"});
                return;
            }
            var contents = data.items;
            node.state = contents.map(function (e) { return e.id; });
            node.status({});
            node.on("input", function(msg) {
                node.status({fill:"blue",shape:"dot",text:"checking for changes"});
                YoutubeAPI.playlistItems.list({ part: node.part, playlistId: node.playlistid, maxResults: 50 }, function(err, data) {
                    if (err) {
                       node.error("failed to fetch YouTube Playlist : " + err);
                       node.status({fill:"red",shape:"ring",text:"error"});
                       return;
                    }
                    node.status({});

                    msg.playlistid = node.playlistid;

                    var newContents = data.items;
                    var seen = {};
                    var i;

                    node.status({fill:"green",shape:"dot",text:"processing"});

                    for (i = 0; i < node.state.length; i++) {
                        seen[node.state[i]] = true;
                    }

                    for (i = 0; i < newContents.length; i++) {

                        var id = newContents[i].id;
                        var item = newContents[i];

                        if (seen[id]) {
                            delete seen[id];
                        } else {
                            msg.title = item.snippet.title;
                            msg.url = item.snippet.thumbnails.medium.url;
                            msg.payload = item;
                            node.send(msg);
                        }
                    }

                    node.state = newContents.map(function (e) {return e.id;});

                    node.status({});
                });
            });
            var interval = setInterval(function() {
                node.emit("input", {});
            }, 3600000); // 1 Hour
            node.on("close", function() {
                if (interval !== null) {
                    clearInterval(interval);
                }
            });
        });
    }
    RED.nodes.registerType("YouTube PlayList-List", YouTubePlayListList);


}
