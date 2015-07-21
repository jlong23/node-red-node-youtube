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

    function GoogleAPINode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        if (this.credentials &&
            this.credentials.apikey) {
            this.YoutubeAPI = require("youtube-api");
            this.YoutubeAPI.authenticate({
                type: "key",
                key: this.credentials.apikey
            });
            
            node.log( "Reauthenticating YouTube API with " + this.credentials.apikey );
        }
    }

    RED.nodes.registerType("google-config",GoogleAPINode,{
        credentials: {
            apikey: { type:"text" }
        }
    });


    function PlayListItemsList(n) {
        RED.nodes.createNode(this,n);
        this.config = RED.nodes.getNode(n.config);
        var node = this;
        var YoutubeAPI = this.config ? this.config.YoutubeAPI : null;

	    if (!YoutubeAPI) {
            node.warn("Missing Google credentials");
            node.status({fill:"red",shape:"ring",text:"Missing Google credentials"});
            return;
        }

        node.status({});
        node.on("input", function(msg) {
            this.part = n.part || msg.part || "snippet";
            this.playlistId = n.playlistId || msg.playlistId;
            this.playlistItemIds = n.playlistItemIds || msg.playlistItemIds;
            this.maxResults = n.maxResults || msg.maxResults || "5";
            this.onBehalfOfContentOwner = n.onBehalfOfContentOwner || msg.onBehalfOfContentOwner;    
            this.pageToken = n.pageToken || msg.pageToken;
            this.videoId = n.videoId || msg.videoId;
            this.fields = n.fields || msg.fields;
                
            var jsonData = { part: this.part };
            
            if( this.playlistId )
                jsonData.playlistId = this.playlistId; 

            if( this.playlistItemIds )
                jsonData.id = this.playlistItemIds; 

            if( this.maxResults ) 
                jsonData.maxResults = this.maxResults;
                
            if( this.onBehalfOfContentOwner ) 
                jsonData.onBehalfOfContentOwner = this.onBehalfOfContentOwner;
                
            if( this.pageToken ) 
                jsonData.pageToken =  this.pageToken;
                            
            if( this.videoId ) 
                jsonData.videoId = this.videoId;
                
            if( this.fields ) 
                jsonData.fields = this.fields;
            
            node.log( JSON.stringify( jsonData ));            

            node.status({fill:"blue",shape:"dot",text:"Running Query..."});
            YoutubeAPI.playlistItems.list( jsonData, function(err, data) {
                if (err) {
                    node.error("failed to fetch YouTube PlaylistItems : " + err);
                    node.log( JSON.stringify( err ));
                    
                    node.status({fill:"red",shape:"ring",text:"error"});
                    return;
                }
                
                node.status({});
    
                node.status({fill:"green",shape:"dot",text:"processing"});
                
                msg.topic = "/youtube.v3/playListItemsResponse";
                msg.payload = data;
                node.send(msg);
    
                node.status({});
            });
        });
    }
    RED.nodes.registerType("YouTube PlayListItems", PlayListItemsList);

    
    
    function PlayListsList(n) {
        RED.nodes.createNode(this,n);
        this.config = RED.nodes.getNode(n.config);
        var node = this;
        var YoutubeAPI = this.config ? this.config.YoutubeAPI : null;

	    if (!YoutubeAPI) {
            node.warn("Missing Google credentials");
            node.status({fill:"red",shape:"ring",text:"Missing Google credentials"});
            return;
        }

        node.status({});
        node.on("input", function(msg) {
            	
            this.part = n.part || msg.part || "snippet";
            this.playlistId = n.playlistId || msg.playlistId || "";
            this.channelId = n.channelId || msg.channelId || "";
            this.maxResults = n.maxResults || msg.maxResults || "5";
            this.mine = n.mine || msg.mine || "";
            this.onBehalfOfContentOwner = n.onBehalfOfContentOwner || msg.onBehalfOfContentOwner || "";    
            this.onBehalfOfContentOwnerChannel = n.onBehalfOfContentOwnerChannel || msg.onBehalfOfContentOwnerChannel || "";    
            this.pageToken = n.pageToken || msg.pageToken || "";
                
            var jsonData = { part: node.part };
            if( this.playlistId ) 
                jsonData.id = this.playlistId; 

            if( this.channelId ) 
                jsonData.channelId = this.channelId; 

            if( this.maxResults ) 
                jsonData.maxResults = this.maxResults;
                
            if( this.mine ) 
                jsonData.mine = this.mine;
                
            if( this.onBehalfOfContentOwner ) 
                jsonData.onBehalfOfContentOwner = this.onBehalfOfContentOwner;
                
            if( this.onBehalfOfContentOwnerChannel ) 
                jsonData.onBehalfOfContentOwnerChannel = this.onBehalfOfContentOwnerChannel;
                
            if( this.pageToken ) 
                jsonData.pageToken = this.pageToken;
                
            node.log( JSON.stringify( jsonData ));            

            node.status({fill:"blue",shape:"dot",text:"Running Query..."});
            YoutubeAPI.playlists.list( jsonData, function(err, data) {
                if (err) {
                    node.error("failed to fetch YouTube Playlists : " + err);
                    node.log( JSON.stringify( err ));
                    
                    node.status({fill:"red",shape:"ring",text:"error"});
                    return;
                }
                
                node.status({});
    
                node.status({fill:"green",shape:"dot",text:"processing"});
                
                msg.topic = "/youtube.v3/playListResponse";
                msg.payload = data;
                node.send(msg);
    
                node.status({});
            });
        });
    }
    RED.nodes.registerType("YouTube PlayLists", PlayListsList);


    
    
    function ChannelsList(n) {
        RED.nodes.createNode(this,n);
        this.config = RED.nodes.getNode(n.config);
        var node = this;
        var YoutubeAPI = this.config ? this.config.YoutubeAPI : null;

	if (!YoutubeAPI) {
            node.warn("Missing Google credentials");
            node.status({fill:"red",shape:"ring",text:"Missing Google credentials"});
            return;
        }

        node.status({});
        node.on("input", function(msg) {
            	
            this.part = n.part || msg.part || "snippet";
            this.categoryId = n.categoryId || msg.categoryId || "";
            this.forUsername = n.forUsername || msg.forUsername || "";            
            this.channelIds = n.channelIds || msg.channelIds || "";
            this.managedByMe = n.managedByMe || msg.managedByMe || "";            
            this.mine = n.mine || msg.mine || "";            
            this.mySubscribers = n.mySubscribers || msg.mySubscribers || "";                        
            this.maxResults = n.maxResults || msg.maxResults || "5";
            this.onBehalfOfContentOwner = n.onBehalfOfContentOwner || msg.onBehalfOfContentOwner || "";    
            this.pageToken = n.pageToken || msg.pageToken || "";
                
            var jsonData = { part: node.part };
            if( this.categoryId ) 
                jsonData.categoryId = node.categoryId; 

            if( this.forUsername ) 
                jsonData.forUsername = node.forUsername; 

            if( this.channelIds ) 
                jsonData.id = this.channelId; 

            if( this.managedByMe ) 
                jsonData.managedByMe = this.managedByMe; 

            if( this.mine ) 
                jsonData.mine = this.mine; 

            if( this.mySubscribers ) 
                jsonData.mySubscribers = this.mySubscribers; 

            if( this.maxResults ) 
                jsonData.maxResults = this.maxResults;
                
            if( this.onBehalfOfContentOwner ) 
                jsonData.onBehalfOfContentOwner = this.onBehalfOfContentOwner;
                
            if( this.pageToken ) 
                jsonData.pageToken = this.pageToken;

            node.log( JSON.stringify( jsonData ));            

            
            node.status({fill:"blue",shape:"dot",text:"Running Query..."});
            YoutubeAPI.channels.list( jsonData, function(err, data) {
                if (err) {
                    node.error("failed to fetch YouTube Channels : " + err);
                    node.log( JSON.stringify( err ));                    
                    
                    node.status({fill:"red",shape:"ring",text:"error"});
                    return;
                }
                
                node.status({});
    
                node.status({fill:"green",shape:"dot",text:"processing"});
                
                msg.topic = "/youtube.v3/channelListResponse";
                msg.payload = data;
                node.send(msg);
    
                node.status({});
            });
        });
    }
    RED.nodes.registerType("YouTube Channels", ChannelsList);

}
