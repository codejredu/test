

import { initCharacterCreator } from './Caracter.js';

document.addEventListener('DOMContentLoaded', () => {
    // START OF CUSTOM TOOLBOX RENDERER
    
    /**
     * Safely encode a string to Base64, handling Unicode characters.
     * @param {string} str The string to encode.
     * @returns {string} The Base64 encoded string.
     */
    function safeBtoa(str) {
        // First, URI-encode the string, then convert to a format btoa can handle.
        return btoa(unescape(encodeURIComponent(str)));
    }
    
    /**
     * Safely decode a Base64 string, handling Unicode characters.
     * @param {string} base64 The Base64 string to decode.
     * @returns {string} The decoded string.
     */
    function safeAtob(base64) {
         // First, atob the string, then decode the URI-encoded characters.
        return decodeURIComponent(escape(atob(base64)));
    }

    /**
     * Helper function to convert a hex color to an rgba string.
     * @param {string} hex The hex color string (e.g., "#FF6B1A").
     * @param {number} alpha The alpha transparency (0.0 to 1.0).
     * @returns {string} The rgba color string.
     */
    function hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) { // 3-digit hex
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) { // 6-digit hex
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    class KidiToolboxCategory extends Blockly.ToolboxCategory {
        createDom_() {
            super.createDom_(); // Let the parent class create the basic structure

            const iconUri = this.toolboxItemDef_['icon-uri'];
            if (iconUri) {
                const label = this.rowDiv_.querySelector('.blocklyTreeLabel');
                if (label) {
                    const icon = document.createElement('img');
                    icon.src = iconUri;
                    icon.className = 'kidi-category-icon';
                    label.insertBefore(icon, label.firstChild);
                }
            }
            
            // Store colors in CSS variables on the element itself for the new CSS rule to use
            this.rowDiv_.style.setProperty('--category-color', this.colour_);
            this.rowDiv_.style.setProperty('--category-bg-color', hexToRgba(this.colour_, 0.08));
            
            return this.rowDiv_;
        }
        
        setSelected(isSelected) {
            super.setSelected(isSelected);
            // Just toggle a class. The CSS will handle the styling.
            this.rowDiv_.classList.toggle('kidi-category-selected', isSelected);
        }
    }

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName,
        KidiToolboxCategory, 
        true // Allow override
    );
    // END OF CUSTOM TOOLBOX RENDERER

    // START OF INLINED GIF PARSER
    // A simplified GIF parser based on jsgif.
    const parseGIF = (arrayBuffer) => {
        const data = new Uint8Array(arrayBuffer);
        let pos = 0;
        const frames = [];
        let gct = null;
        let loopCount = 0;

        const readString = (length) => {
            let str = '';
            for (let i = 0; i < length; i++) {
                str += String.fromCharCode(data[pos++]);
            }
            return str;
        };

        const readByte = () => data[pos++];
        const readUInt16 = () => (readByte() | (readByte() << 8));
        
        const readColorTable = (size) => {
            const table = [];
            for (let i = 0; i < size; i++) {
                table.push([readByte(), readByte(), readByte()]);
            }
            return table;
        };

        const readLZW = (minCodeSize, data, pixels) => {
            let pos = 0; 
            const readCode = (size) => {
                let code = 0;
                for (let i = 0; i < size; i++) {
                    if (data[pos >> 3] & (1 << (pos & 7))) {
                        code |= 1 << i;
                    }
                    pos++;
                }
                return code;
            };
            
            const output = (index) => {
                pixels.push(index);
            };

            const clearCode = 1 << minCodeSize;
            const eoiCode = clearCode + 1;
            let codeSize = minCodeSize + 1;
            let dict = [];

            const clear = () => {
                dict = [];
                codeSize = minCodeSize + 1;
                for (let i = 0; i < clearCode; i++) {
                    dict[i] = [i];
                }
                dict[clearCode] = [];
                dict[eoiCode] = null;
            };

            let code, last;
            while (true) {
                last = code;
                code = readCode(codeSize);
                if (code === clearCode) {
                    clear();
                    continue;
                }
                if (code === eoiCode) break;
                if (code < dict.length) {
                    if (last !== clearCode) {
                        dict.push(dict[last].concat(dict[code][0]));
                    }
                } else {
                    if (code !== dict.length) throw new Error('Invalid LZW code.');
                    dict.push(dict[last].concat(dict[last][0]));
                }
                dict[code].forEach(output);
                if (dict.length === (1 << codeSize) && codeSize < 12) {
                    codeSize++;
                }
            }
        };

        // Header
        if (readString(6) !== 'GIF89a') throw new Error('Not a GIF file.');

        // Logical Screen Descriptor
        const width = readUInt16();
        const height = readUInt16();
        const packed = readByte();
        const gctFlag = (packed & 0x80) !== 0;
        const gctSize = 2 << (packed & 0x07);
        pos++; // Skip background color index
        pos++; // Skip pixel aspect ratio

        if (gctFlag) {
            gct = readColorTable(gctSize);
        }

        let gce = null;
        while(pos < data.length) {
            const blockType = readByte();
            if (blockType === 0x2C) { // Image Descriptor
                const left = readUInt16();
                const top = readUInt16();
                const w = readUInt16();
                const h = readUInt16();
                const imagePacked = readByte();
                const lctFlag = (imagePacked & 0x80) !== 0;
                const interlace = (imagePacked & 0x40) !== 0;
                const lctSize = 2 << (imagePacked & 0x07);
                const ct = lctFlag ? readColorTable(lctSize) : gct;

                const minCodeSize = readByte();
                const lzwData = [];
                let lzwBlockSize;
                while ((lzwBlockSize = readByte()) !== 0) {
                    for(let i=0; i < lzwBlockSize; ++i) lzwData.push(data[pos++]);
                }
                
                const pixelIndices = [];
                readLZW(minCodeSize, new Uint8Array(lzwData), pixelIndices);

                const image = {
                    left, top, w, h, pixelIndices,
                    colorTable: ct,
                    delay: gce ? gce.delay : 0,
                    disposalMethod: gce ? gce.disposalMethod : 0,
                    transparentColorIndex: gce ? gce.transparentColorIndex : null,
                };
                frames.push(image);
                gce = null;

            } else if (blockType === 0x21) { // Extension
                const extType = readByte();
                if (extType === 0xF9) { // Graphic Control Extension
                    readByte(); // block size
                    const gcePacked = readByte();
                    const transparentFlag = (gcePacked & 1) !== 0;
                    gce = {
                        disposalMethod: (gcePacked >> 2) & 7,
                        delay: readUInt16(),
                        transparentColorIndex: transparentFlag ? readByte() : null,
                    };
                    pos++; // skip block terminator
                } else if (extType === 0xFF) { // Application Extension
                   readByte(); // block size
                   if (readString(11) === 'NETSCAPE2.0') {
                       readByte(); // sub-block size
                       pos++; // always 1
                       loopCount = readUInt16();
                       readByte(); // block terminator
                   } else {
                       let appExtSize;
                       while((appExtSize = readByte()) !== 0) {
                           pos += appExtSize;
                       }
                   }
                } else {
                     let unknownExtSize;
                     while((unknownExtSize = readByte()) !== 0) {
                        pos += unknownExtSize;
                    }
                }
            } else if (blockType === 0x3B) { // Trailer
                break;
            } else {
                // Unknown block, ignore.
            }
        }
        return { width, height, frames, loopCount };
    };
    // END OF INLINED GIF PARSER


    // Monkey-patch FieldImage to vertically align icons better.
    const originalInitView = Blockly.FieldImage.prototype.initView;
    Blockly.FieldImage.prototype.initView = function() {
        originalInitView.call(this);
        const yOffset = 3; // Pixels to shift down for better alignment
        this.imageElement_.setAttribute('transform', `translate(0, ${yOffset})`);
    };

    // --- Main Application Elements ---
    const stageArea = document.getElementById('stage-area');
    const containerWrapper = document.getElementById('container-wrapper');
    const spritesList = document.getElementById('sprites-list');
    const backdropsList = document.getElementById('backdrops-list');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const enterFullscreenIcon = document.getElementById('enter-fullscreen-icon');
    const exitFullscreenIcon = document.getElementById('exit-fullscreen-icon');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const loadInput = document.getElementById('load-input');
    const fullscreenRunButton = document.getElementById('fullscreen-run-button');
    const fullscreenResetButton = document.getElementById('fullscreen-reset-button');
    const toggleGridButton = document.getElementById('toggle-grid-button');
    const gridCanvas = document.getElementById('grid-canvas');

    // --- Sprite Properties Panel Elements ---
    const propertiesPanel = document.getElementById('sprite-properties-panel');
    const propName = document.getElementById('prop-name');
    const propX = document.getElementById('prop-x');
    const propY = document.getElementById('prop-y');
    const propShow = document.getElementById('prop-show');
    const propHide = document.getElementById('prop-hide');
    const propSize = document.getElementById('prop-size');
    const propDirection = document.getElementById('prop-direction');
    const propRotationAllAround = document.getElementById('rotation-all-around');
    const propRotationLeftRight = document.getElementById('rotation-left-right');
    const propRotationDontRotate = document.getElementById('rotation-dont-rotate');
    
    // --- Angle Picker elements ---
    const anglePickerWidget = document.getElementById('angle-picker-widget');
    const anglePickerDial = document.getElementById('angle-picker-dial');
    const anglePickerHandle = document.getElementById('angle-picker-handle');
    
    // --- GIF Animation Panel elements ---
    const gifAnimationPanel = document.getElementById('gif-animation-panel');
    const gifPlayPauseBtn = document.getElementById('gif-play-pause-btn');
    const gifPlayIcon = document.getElementById('gif-play-icon');
    const gifPauseIcon = document.getElementById('gif-pause-icon');
    const gifSpeedSlider = document.getElementById('gif-speed-slider');
    const gifSpeedValue = document.getElementById('gif-speed-value');
    
    // --- Gallery Elements ---
    const spriteGallery = document.getElementById('sprite-gallery');
    const backgroundGallery = document.getElementById('background-gallery');
    const soundGallery = document.getElementById('sound-gallery');
    const allGalleries = [spriteGallery, backgroundGallery, soundGallery];

    // --- Sound System Elements ---
    const soundsList = document.getElementById('sounds-list');
    const addSoundButton = document.getElementById('add-sound-button');
    const uploadSoundHeaderButton = document.getElementById('upload-sound-header-button');
    const recordSoundHeaderButton = document.getElementById('record-sound-header-button');
    const closeSoundGalleryButton = document.getElementById('close-sound-gallery-button');
    const soundGalleryGrid = document.getElementById('sound-gallery-grid');
    const addSelectedSoundsButton = document.getElementById('add-selected-sounds-button');
    const soundUploadInput = document.getElementById('sound-upload-input');
    const soundRecorderModal = document.getElementById('sound-recorder-modal');
    const recorderCloseBtn = document.getElementById('recorder-close-btn');
    const recorderVisualizer = document.getElementById('recorder-visualizer');
    const recorderTimer = document.getElementById('recorder-timer');
    const recorderRecordBtn = document.getElementById('recorder-record-btn');
    const recorderStopBtn = document.getElementById('recorder-stop-btn');
    const recorderRerecordBtn = document.getElementById('recorder-rerecord-btn');
    const recorderSaveBtn = document.getElementById('recorder-save-btn');
    const recorderMessage = document.getElementById('recorder-message');
    const recorderUIContent = document.getElementById('recorder-ui-content');
    const recorderAudioPreview = document.getElementById('recorder-audio-preview');
    const recorderPreviewContainer = document.getElementById('recorder-preview-container');
    const recorderSoundName = document.getElementById('recorder-sound-name');
    
    // --- Application State ---
    const STAGE_WIDTH = 480;
    const STAGE_HEIGHT = 360;
    let workspace;
    let sprites = {};
    let activeSpriteId = null;
    let executionCancelled = false;
    let isLoadingProject = false;
    let justDragged = false;
    let dragStartX, dragStartY;
    let collisionState = new Set();
    let scriptRunner = null;
    let lastTimestamp = 0;
    let nextZIndex = 10;
    // Make frameDeltaTime accessible globally so the generated code can see it.
    window.frameDeltaTime = 1000 / 60; // Time in ms for one frame at 60fps.
    
    // --- Sound System State ---
    let currentPreviewAudio = null;
    let selectedSoundsForAdd = new Set();
    let mediaRecorder = null;
    let audioChunks = [];
    let mediaStream = null;
    let recorderTimerInterval = null;
    let recordedBlob = null;
    
    const log = (message) => {
        console.log(message);
    };

    const openGallery = (galleryToOpen) => {
        allGalleries.forEach(gallery => {
            if (gallery !== galleryToOpen) {
                gallery.classList.remove('visible');
            }
        });
        galleryToOpen.classList.add('visible');
    };

    const getActiveSprite = () => sprites[activeSpriteId] || null;
    
    const updatePropertiesPanel = () => {
        const sprite = getActiveSprite();
        if (sprite) {
            propertiesPanel.classList.remove('hidden');
            
            propName.value = sprite.name;
            propX.value = Math.round(sprite.x);
            propY.value = Math.round(sprite.y);
            propSize.value = sprite.size;
            // Always display the normalized direction (0-359)
            propDirection.value = Math.round(((sprite.direction % 360) + 360) % 360);

            if (sprite.opacity === 1) {
                propShow.classList.add('active');
                propHide.classList.remove('active');
            } else {
                propShow.classList.remove('active');
                propHide.classList.add('active');
            }
            
            // Update rotation style buttons
            propRotationAllAround.classList.toggle('active', sprite.rotationStyle === 'all-around');
            propRotationLeftRight.classList.toggle('active', sprite.rotationStyle === 'left-right');
            propRotationDontRotate.classList.toggle('active', sprite.rotationStyle === 'dont-rotate');

            if (sprite.isGif && sprite.animation) {
                gifAnimationPanel.classList.remove('hidden');
                gifSpeedSlider.value = sprite.gifSpeed;
                gifSpeedValue.textContent = `${Number(sprite.gifSpeed).toFixed(1)}x`;
                const isPlaying = sprite.animation.previewIsPlaying;
                gifPlayIcon.classList.toggle('hidden', isPlaying);
                gifPauseIcon.classList.toggle('hidden', !isPlaying);
            } else {
                gifAnimationPanel.classList.add('hidden');
            }

        } else {
            propertiesPanel.classList.add('hidden');
        }
    };

    window.switchBackdrop = (url) => {
        if (!url || url === 'NONE') return;
        try {
            stageArea.style.backgroundImage = `url("${url}")`;
            document.querySelectorAll('.backdrop-card').forEach(card => card.classList.remove('selected'));
            const cardToSelect = Array.from(document.querySelectorAll('.backdrop-card')).find(card => card.dataset.url === url);
            if (cardToSelect) cardToSelect.classList.add('selected');
            log(`הרקע הוחלף ל: ${url}`);
        } catch (e) {
            console.error("Failed to switch backdrop:", e);
        }
    };
    
    // --- Frame-Based Script Execution Engine (like Scratch) ---
    class ScriptRunner {
        constructor(onScriptsComplete) {
            this.threads = [];
            this.isRunning = false;
            this.onScriptsComplete = onScriptsComplete; // Callback for when all scripts are done.
            log('מנוע ריצה חדש נוצר.');
        }

        add(generator) {
            this.threads.push(generator);
            if (!this.isRunning) {
                this.start();
            }
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            executionCancelled = false;
            log('מנוע ריצה התחיל.');
        }

        stop() {
            this.threads = [];
            executionCancelled = true;
            log('מנוע ריצה נעצר.');
        }

        tick() {
            if (!this.isRunning) return;

            for (let i = this.threads.length - 1; i >= 0; i--) {
                const generator = this.threads[i];
                const result = generator.next();
                if (result.done) {
                    this.threads.splice(i, 1);
                }
            }
            
            if (this.threads.length === 0) {
                this.isRunning = false; // Set running to false before calling callback
                // All scripts finished naturally. Call the completion callback.
                if (this.onScriptsComplete) {
                    this.onScriptsComplete();
                }
            }
        }
    }

    // Custom field for messages
    const messageOptions = [
        [{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
            width: 24, height: 24, alt: 'לב אדום'
        }, 'red_heart'],
        [{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
            width: 24, height: 24, alt: 'כוכב כחול'
        }, 'blue_star'],
        [{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
            width: 24, height: 24, alt: 'משולש ירוק'
        }, 'green_triangle'],
        [{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="yellow" stroke="black" stroke-width="0.5"><circle cx="12" cy="12" r="10"/></svg>',
            width: 24, height: 24, alt: 'עיגול צהוב'
        }, 'yellow_circle'],
        [{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="purple"><path d="M3 3h18v18H3z"/></svg>',
            width: 24, height: 24, alt: 'ריבוע סגול'
        }, 'purple_square'],
        [{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M12 2.5l7.5 5.5-3 9H7.5l-3-9L12 2.5z"/></svg>',
            width: 24, height: 24, alt: 'מחומש כתום'
        }, 'orange_pentagon']
    ];

    class FieldMessage extends Blockly.FieldDropdown {
        constructor() {
            super(FieldMessage.getOptions);
        }

        static getOptions() {
            return messageOptions;
        }
        
        initView() {
            super.initView();
            this.imageElement_ = Blockly.utils.dom.createSvgElement('image',
                { 'height': '24px', 'width': '24px' },
                this.fieldGroup_
            );
            this.updateImageView_();
        }

        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            this.updateImageView_();
        }
        
        updateImageView_() {
            if (this.value_ && this.imageElement_) {
                const options = this.getOptions(false);
                const selectedOption = options.find(opt => opt[1] === this.value_);
                if (selectedOption) {
                    this.imageElement_.setAttributeNS(
                        'http://www.w3.org/1999/xlink',
                        'xlink:href',
                        selectedOption[0].src
                    );
                    if(this.textElement_) {
                    this.textElement_.style.display = 'none';
                    }
                }
            }
        }
    }
    Blockly.fieldRegistry.register('field_message', FieldMessage);
    
    const updateSpriteAppearance = (spriteId) => {
        const spriteData = sprites[spriteId];
        if (!spriteData) return;

        const container = document.getElementById(`container-${spriteData.id}`);
        const wrapper = container.querySelector('.sprite-wrapper');
        
        if (container && wrapper) {
            const rect = stageArea.getBoundingClientRect();
            const stageToSpriteX = STAGE_WIDTH / rect.width;
            const stageToSpriteY = STAGE_HEIGHT / rect.height;

            const stageX = spriteData.x / stageToSpriteX;
            const stageY = -spriteData.y / stageToSpriteY;
            
            const baseSize = 160;
            const newSize = baseSize * (spriteData.size / 100);

            // --- Rotation Logic ---
            let rotationTransform = '';
            switch(spriteData.rotationStyle) {
                case 'left-right':
                    // Normalize direction to [0, 360)
                    const normalizedDir = ((spriteData.direction % 360) + 360) % 360;
                    // Flip when direction is pointing left-ish (in the range (90, 270))
                    const isFlipped = normalizedDir > 90 && normalizedDir < 270;
                    rotationTransform = isFlipped ? 'scaleX(-1)' : 'scaleX(1)';
                    break;
                case 'dont-rotate':
                    rotationTransform = ''; // No rotation at all
                    break;
                case 'all-around':
                default:
                    rotationTransform = `rotate(${spriteData.direction - 90}deg)`;
                    break;
            }
            // --- End Rotation Logic ---

            // Apply styles to the single wrapper
            wrapper.style.width = `${newSize}px`;
            wrapper.style.height = `${newSize}px`;
            wrapper.style.opacity = spriteData.opacity;
            wrapper.style.transform = `translate(-50%, -50%) ${rotationTransform}`;
            
            // Position the main container which holds the wrapper
            container.style.transform = `translate(${stageX}px, ${stageY}px)`;
            container.style.zIndex = spriteData.zIndex;
            
            // After any visual update, check for collisions
            checkCollisions();
        }
    };
    
    const updateGoToXYBlockInToolbox = (x, y) => {
        const toolbox = workspace?.getToolbox();
        if (!toolbox) return;

        const flyout = toolbox.getFlyout();
        if (!flyout || !flyout.isVisible()) {
            return;
        }

        const flyoutWorkspace = flyout.getWorkspace();
        const blocks = flyoutWorkspace.getTopBlocks(false);

        for (const block of blocks) {
            if (block.type === 'motion_go_to_xy') {
                try {
                    const shadowX = block.getInput('X')?.connection?.targetBlock();
                    if (shadowX && shadowX.isShadow()) {
                        shadowX.setFieldValue(Math.round(x), 'NUM');
                    }
                    const shadowY = block.getInput('Y')?.connection?.targetBlock();
                    if (shadowY && shadowY.isShadow()) {
                        shadowY.setFieldValue(Math.round(y), 'NUM');
                    }
                } catch (e) {
                    console.warn('Could not update toolbox block.', e);
                }
                break; 
            }
        }
    };

    /**
     * Centralized function to update a sprite's appearance on stage
     * and its properties in the panel if it's the active sprite.
     * @param {object} sprite The sprite object to refresh.
     */
    window.refreshSprite = (sprite) => {
        if (!sprite) return;
        updateSpriteAppearance(sprite.id);
        if (sprite.id === activeSpriteId) {
            updatePropertiesPanel();
            updateGoToXYBlockInToolbox(sprite.x, sprite.y);
        }
    };

    /**
     * Refreshes any 'event_when_bump' blocks in the currently visible workspace
     * to reflect changes in the available sprites.
     */
    function refreshVisibleBumpBlocks() {
        if (!workspace) return;
        const allBlocks = workspace.getAllBlocks(false);
        allBlocks.forEach(block => {
            if (block.type === 'event_when_bump') {
                const field = block.getField('TARGET_SPRITE');
                if (field) {
                    const currentValue = field.getValue();
                    const activeSprite = getActiveSprite();
                    const otherSpritesCount = activeSprite 
                        ? Object.keys(sprites).filter(id => id !== activeSprite.id).length 
                        : Object.keys(sprites).length -1;
                    
                    if (otherSpritesCount <= 0 && currentValue !== 'NONE') {
                        field.setValue('NONE');
                    } else if (otherSpritesCount > 0 && currentValue === 'NONE') {
                        field.setValue('ANY');
                    } else {
                        const options = field.getOptions(false);
                        const currentSelectionExists = options.some(opt => opt[1] === currentValue);
                        if (!currentSelectionExists && currentValue !== 'ANY') {
                            field.setValue('ANY');
                        }
                    }
                }
            }
        });
    }

    const createNewSprite = (name, imageUrl, initialX = 0, initialY = 0, isCustom = false, characterData = null, gifSpeed = 1.0) => {
        const id = `sprite-${Date.now()}`;
        const isGif = imageUrl.toLowerCase().endsWith('.gif') || imageUrl.startsWith('data:image/gif');

        const spriteData = {
            id,
            name,
            imageUrl,
            x: initialX,
            y: initialY,
            direction: 90,
            opacity: 1,
            size: 100,
            rotationStyle: 'all-around',
            workspaceXml: null,
            isCustom: isCustom,
            characterData: characterData,
            isGif: isGif,
            animation: null,
            gifSpeed: gifSpeed,
            sounds: [],
            zIndex: nextZIndex++,
        };
        
        sprites[id] = spriteData;

        const spriteCard = document.createElement('div');
        spriteCard.classList.add('sprite-card');
        spriteCard.dataset.spriteId = id;
        spriteCard.innerHTML = `
            <img src="${imageUrl}" alt="${name}">
            <div class="delete-button">X</div>
             ${isCustom ? `
                <div class="edit-button" title="ערוך דמות">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                    </svg>
                </div>` : ''}
        `;
        spritesList.appendChild(spriteCard);
        
        if (isCustom && window.characterCreator) {
            spriteCard.querySelector('.edit-button').addEventListener('click', (e) => {
                e.stopPropagation();
                window.characterCreator.openForEdit(id);
            });
        }

        const spriteContainer = document.createElement('div');
        spriteContainer.id = `container-${id}`;
        spriteContainer.classList.add('sprite-container');

        const mainSprite = document.createElement('div');
        mainSprite.classList.add('sprite-wrapper');
        mainSprite.id = id;
        mainSprite.innerHTML = `
            <img src="${imageUrl}" alt="${name}">
            <canvas class="hidden absolute top-0 left-0 w-full h-full"></canvas>
            <div class="speech-bubble"></div>
        `;
        
        spriteContainer.appendChild(mainSprite);
        stageArea.appendChild(spriteContainer);

        if (isGif) {
            loadGifData(spriteData);
        }
        
        const wrapper = spriteContainer.querySelector('.sprite-wrapper');
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            if (justDragged) return;
            handleSpriteClick(id);
        });
        wrapper.addEventListener('mousedown', (e) => startDrag(e, id));
        wrapper.addEventListener('touchstart', (e) => startDrag(e, id));
        
        spriteCard.addEventListener('click', () => {
            setActiveSprite(id);
        });
        spriteCard.querySelector('.delete-button').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSprite(id);
        });

        setActiveSprite(id);
        updateSpriteAppearance(id);
        refreshVisibleBumpBlocks(); // Refresh blocks on other sprites
        return spriteData;
    };

    const deleteSprite = (id) => {
        document.getElementById(`container-${id}`)?.remove();
        document.querySelector(`.sprite-card[data-sprite-id="${id}"]`)?.remove();
        
        delete sprites[id];

        if (activeSpriteId === id) {
            activeSpriteId = null;
            workspace.clear();
            const firstSpriteId = Object.keys(sprites)[0];
            if (firstSpriteId) {
                setActiveSprite(firstSpriteId);
            } else {
                updatePropertiesPanel();
                renderSpriteSounds(null);
                refreshVisibleBumpBlocks();
            }
        } else {
             refreshVisibleBumpBlocks();
        }
        log(`הדמות ${id} נמחקה.`);
    };
    
    const setActiveSprite = (spriteId) => {
        if ((scriptRunner && scriptRunner.isRunning) || activeSpriteId === spriteId) return;

        // 1. Save current workspace
        if (activeSpriteId && sprites[activeSpriteId]) {
            const oldDom = Blockly.Xml.workspaceToDom(workspace);
            sprites[activeSpriteId].workspaceXml = Blockly.Xml.domToText(oldDom);
        }

        // 2. Deselect old card
        if (activeSpriteId) {
            const prevCard = document.querySelector(`.sprite-card[data-sprite-id="${activeSpriteId}"]`);
            if (prevCard) {
                prevCard.classList.remove('selected');
            }
        }

        // 3. Set new active sprite
        activeSpriteId = spriteId;

        // 4. Clear and load new workspace
        workspace.clear();
        const newSprite = sprites[spriteId];
        if (newSprite && newSprite.workspaceXml) {
            try {
                const newDom = Blockly.Xml.textToDom(newSprite.workspaceXml);
                Blockly.Xml.domToWorkspace(newDom, workspace);
            } catch (e) {
                console.error("Error loading workspace XML:", e);
                workspace.clear(); // Clear on error to avoid broken state
            }
        }

        // 5. Select new card
        const newCard = document.querySelector(`.sprite-card[data-sprite-id="${spriteId}"]`);
        if (newCard) {
            newCard.classList.add('selected');
        }
        
        // 6. Update properties panel and sounds list
        updatePropertiesPanel();
        renderSpriteSounds(newSprite);
        refreshVisibleBumpBlocks();
        
        // 7. Refresh toolbox to update dynamic fields (like sounds)
        workspace.refreshToolboxSelection();

        log(`הדמות הפעילה היא: ${newSprite.name}`);
    };

    let isDragging = false;
    let dragSpriteId = null;
    let initialMouseX, initialMouseY, initialSpriteX, initialSpriteY;

    const getPointerPosition = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };
    
    const startDrag = (e, id) => {
        e.preventDefault();
        isDragging = true;
        dragSpriteId = id;
        const spriteData = sprites[dragSpriteId];

        setActiveSprite(id);
        const { x, y } = getPointerPosition(e);
        dragStartX = x;
        dragStartY = y;
        initialMouseX = x;
        initialMouseY = y;
        initialSpriteX = spriteData.x;
        initialSpriteY = spriteData.y;
        document.querySelector(`#container-${dragSpriteId}`).style.transition = 'none';
        log('הדמות נתפסה לגרירה.');
    };

    const drag = (e) => {
        if (isDragging && dragSpriteId) {
            const spriteData = sprites[dragSpriteId];
            const { x, y } = getPointerPosition(e);
            const deltaX = x - initialMouseX;
            const deltaY = y - initialMouseY;
            
            const rect = stageArea.getBoundingClientRect();
            const scaleX = STAGE_WIDTH / rect.width;
            const scaleY = STAGE_HEIGHT / rect.height;

            spriteData.x = initialSpriteX + deltaX * scaleX;
            spriteData.y = initialSpriteY - deltaY * scaleY;
            
            window.refreshSprite(spriteData);
        }
    };

    const endDrag = (e) => {
        if (isDragging && dragSpriteId) {
             const pointer = e.changedTouches ? e.changedTouches[0] : e;
            const deltaX = pointer.clientX - dragStartX;
            const deltaY = pointer.clientY - dragStartY;
            const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);

            if (distance > 5) { // Threshold to differentiate click from drag
                justDragged = true;
                setTimeout(() => { justDragged = false; }, 50);
            } else {
                justDragged = false;
            }

            const spriteData = sprites[dragSpriteId];
            document.querySelector(`#container-${dragSpriteId}`).style.transition = 'transform 0.5s ease-out';
            window.refreshSprite(spriteData); // Final update
            log(`הדמות נגררה למיקום חדש (x: ${spriteData.x.toFixed(0)}, y: ${spriteData.y.toFixed(0)})`);
        }
        isDragging = false;
        dragSpriteId = null;
    };

    stageArea.addEventListener('mousemove', drag);
    stageArea.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);

    window.addEventListener('resize', () => {
        Object.keys(sprites).forEach(updateSpriteAppearance);
        Blockly.svgResize(workspace);
    });
    
    function positionNumberPad(field) {
        const numberPad = document.getElementById('number-pad-container');
        if (!field || numberPad.style.display !== 'block') {
            return;
        }

        // Make pad temporarily visible but transparent to measure its dimensions
        numberPad.style.visibility = 'hidden';
        const padRect = numberPad.getBoundingClientRect();
        
        const blockSvg = field.getSourceBlock().getSvgRoot();
        const blockBounds = blockSvg.getBoundingClientRect();

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 5; // Margin from screen edges

        // --- Vertical Positioning ---
        let finalTop;
        // Try positioning below first
        if (blockBounds.bottom + padRect.height + margin < viewportHeight) {
            finalTop = blockBounds.bottom + margin;
        } 
        // If not enough space below, try positioning above
        else if (blockBounds.top - padRect.height - margin > 0) {
            finalTop = blockBounds.top - padRect.height - margin;
        } 
        // If no space above either, position it as best as possible (e.g., at the top)
        else {
            finalTop = margin;
        }

        // --- Horizontal Positioning ---
        let finalLeft;
        // Start by aligning with the block's left edge
        finalLeft = blockBounds.left;
        
        // If it overflows right, align to the right edge of the screen
        if (finalLeft + padRect.width + margin > viewportWidth) {
             finalLeft = viewportWidth - padRect.width - margin;
        }
        
        // Ensure it doesn't go off the left edge
        if (finalLeft < margin) {
            finalLeft = margin;
        }

        numberPad.style.top = `${finalTop}px`;
        numberPad.style.left = `${finalLeft}px`;
        
        numberPad.style.visibility = 'visible';
    }
    
    // Custom Field for Number Pad
    class FieldCustomNumber extends Blockly.FieldNumber {
        constructor(value, min, max, precision, validator) {
            super(value, min, max, precision, validator);
        }

        showEditor_() {
            const numberPad = document.getElementById('number-pad-container');
            const numberPadDisplay = document.getElementById('number-pad-display');
            
            numberPad.currentField = this;
            numberPadDisplay.textContent = '';

            // Show pad to start calculations
            numberPad.style.display = 'block';
            
            positionNumberPad(this);
        }
    }
    Blockly.fieldRegistry.register('field_custom_number', FieldCustomNumber);
    
    // Redefine standard math_number block to use our custom field
    Blockly.Blocks['math_number'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new FieldCustomNumber(0), 'NUM');
            this.setOutput(true, 'Number');
            this.setColour("#40BF4A");
            this.setTooltip("A number.");
            this.setHelpUrl("%{BKY_MATH_NUMBER_HELPURL}");
        }
    };

    Blockly.Blocks['event_when_flag_clicked'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/flag.svg", 35, 35, { alt: "green flag", flipRtl: false }))
                .appendField('\u00A0'.repeat(12));
            this.setNextStatement(true, null);
            this.setColour("#FFC107");
            this.setTooltip("התחל את התסריט כאשר הדגל הירוק נלחץ.");
            this.setHelpUrl("");
        }
    };
    Blockly.JavaScript['event_when_flag_clicked'] = function(block) { return ''; };

    Blockly.Blocks['event_when_sprite_clicked'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/whenprees.svg", 35, 35, "*"))
                .appendField('\u00A0'.repeat(12));
            this.setNextStatement(true, null);
            this.setColour("#FFC107");
            this.setTooltip("התחל את התסריט כאשר לוחצים על הדמות.");
            this.setHelpUrl("");
        }
    };
    Blockly.JavaScript['event_when_sprite_clicked'] = function(block) { return ''; };

    Blockly.Blocks['event_when_key_pressed'] = {
        init: function() {
            const keyOptions = [
                [
                    {
                        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><rect x="1" y="1" width="46" height="22" rx="4" fill="%23fff" stroke="%23555" stroke-width="2"/><text x="24" y="16" font-family="Arial" font-size="12" text-anchor="middle" fill="%23000">רווח</text></svg>',
                        width: 48,
                        height: 24,
                        alt: 'רווח'
                    },
                    'SPACE'
                ],
                [
                     {
                        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="%23fff" stroke="%23555" stroke-width="2"/><path d="M12 8l-4 4h8z" fill="%23555"/></svg>',
                        width: 24,
                        height: 24,
                        alt: 'חץ למעלה'
                    },
                    'UP'
                ],
                [
                    {
                        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="%23fff" stroke="%23555" stroke-width="2"/><path d="M12 16l4-4H8z" fill="%23555"/></svg>',
                        width: 24,
                        height: 24,
                        alt: 'חץ למטה'
                    },
                    'DOWN'
                ],
                [
                    {
                        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="%23fff" stroke="%23555" stroke-width="2"/><path d="M14 12l-4 4V8z" fill="%23555"/></svg>',
                        width: 24,
                        height: 24,
                        alt: 'חץ ימינה'
                    },
                    'RIGHT'
                ],
                [
                    {
                        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="%23fff" stroke="%23555" stroke-width="2"/><path d="M10 12l4-4v8z" fill="%23555"/></svg>',
                        width: 24,
                        height: 24,
                        alt: 'חץ שמאלה'
                    },
                    'LEFT'
                ]
            ];
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/keyboard.svg", 35, 35, { alt: "keyboard icon", flipRtl: false }))
                .appendField(new Blockly.FieldDropdown(keyOptions), "KEY")
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setNextStatement(true, null);
            this.setColour("#FFC107");
            this.setTooltip("הפעל את התסריט כאשר המקש הנבחר נלחץ.");
            this.setHelpUrl("");
        }
    };
    Blockly.JavaScript['event_when_key_pressed'] = function(block) { return ''; };
    
    // Custom field for sprite selection
    class FieldSprite extends Blockly.FieldDropdown {
        constructor() {
            super(FieldSprite.generateOptions);
        }

        static generateOptions() {
            const spriteIds = Object.keys(sprites);
            const activeSprite = getActiveSprite();
            
            const otherSprites = activeSprite 
                ? spriteIds.filter(id => id !== activeSprite.id).map(id => sprites[id])
                : [];

            if (otherSprites.length === 0) {
                return [[{
                    src: '', // Intentionally blank to show an empty field
                    width: 48,
                    height: 48,
                    alt: 'אין דמויות אחרות',
                }, 'NONE']];
            }

            const options = otherSprites.map(sprite => {
                return [
                    {
                        src: sprite.imageUrl,
                        width: 48,
                        height: 48,
                        alt: sprite.name,
                    },
                    sprite.id
                ];
            });
            
            options.unshift([
                 {
                    src: 'https://codejredu.github.io/test/assets/blocklyicon/allman.svg',
                    width: 48,
                    height: 48,
                    alt: 'כל דמות',
                 },
                'ANY'
            ]);

            return options;
        }

        initView() {
            super.initView();
            this.imageElement_ = Blockly.utils.dom.createSvgElement('image', {
                'height': '36px',
                'width': '36px',
                'y': -10,
                'x': 5
            }, this.fieldGroup_);
            this.updateImageView_();
        }

        showEditor_() {
            const options = this.getOptions(false);
            if (options.length === 1 && options[0][1] === 'NONE') {
                return; // Prevent dropdown from showing if there are no options
            }
            super.showEditor_(...arguments);
        }

        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            this.updateImageView_();
        }

        updateImageView_() {
            if (!this.value_ || !this.imageElement_) {
                return;
            }

            const options = this.getOptions(false);
            const selectedOption = options.find(opt => opt[1] === this.value_);

            if (selectedOption && typeof selectedOption[0] === 'object' && selectedOption[0].src) {
                this.imageElement_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', selectedOption[0].src);
                if (this.textElement_) {
                    this.textElement_.style.display = 'none';
                }
            } else {
                // If src is empty or not present, clear the image and hide the text.
                this.imageElement_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '');
                if (this.textElement_) {
                    this.textElement_.style.display = 'none';
                }
            }
        }
    }
    Blockly.fieldRegistry.register('field_sprite', FieldSprite);

    Blockly.Blocks['event_when_bump'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/collision.svg", 35, 35, "*"))
                .appendField(new FieldSprite(), 'TARGET_SPRITE')
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setNextStatement(true, null);
            this.setColour("#FFC107");
            this.setTooltip("התחל את התסריט כאשר דמות זו נוגעת בדמות שנבחרה.");
        }
    };
    Blockly.JavaScript['event_when_bump'] = function(block) { return ''; };


    Blockly.Blocks['event_broadcast'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/send.svg", 35, 35, "*"))
                .appendField(new FieldMessage(), 'MESSAGE')
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#FFC107");
            this.setTooltip("שולח מסר לכל הדמויות.");
        }
    };

    Blockly.JavaScript['event_broadcast'] = function(block) {
        const message = block.getFieldValue('MESSAGE');
        return `
            log('משדר מסר: ${message}');
            const event = new CustomEvent('kidi-broadcast', { detail: { message: '${message}' } });
            window.dispatchEvent(event);
            yield;
        `;
    };

    Blockly.Blocks['event_when_broadcast_received'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/receive.svg", 35, 35, "*"))
                .appendField(new FieldMessage(), 'MESSAGE')
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setNextStatement(true, null);
            this.setColour("#FFC107");
            this.setTooltip("מתחיל תסריט כאשר מתקבל מסר ספציפי.");
        }
    };
    Blockly.JavaScript['event_when_broadcast_received'] = function(block) { return ''; };

    Blockly.Blocks['motion_move_steps'] = {
        init: function() {
            this.appendValueInput("STEPS").setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/walk.svg", 34, 34, "*"))
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("הזז את הדמות בכיוון שהיא פונה.");
        }
    };
    Blockly.JavaScript['motion_move_steps'] = function(block) {
        const steps = Blockly.JavaScript.valueToCode(block, 'STEPS', Blockly.JavaScript.ORDER_ATOMIC) || '10';
        return `
            if (sprite) {
                const distance = Number(${steps});
                const radians = sprite.direction * Math.PI / 180;
                sprite.x += distance * Math.sin(radians);
                sprite.y += distance * Math.cos(radians);
                
                const halfWidth = ${STAGE_WIDTH / 2};
                const halfHeight = ${STAGE_HEIGHT / 2};
                const spriteLogicalWidth = 160 * (sprite.size / 100);
                const spriteLogicalHeight = 160 * (sprite.size / 100);
                const spriteHalfWidth = spriteLogicalWidth / 2;
                const spriteHalfHeight = spriteLogicalHeight / 2;

                if (sprite.x - spriteHalfWidth > halfWidth) {
                    sprite.x = -halfWidth - spriteHalfWidth;
                }
                if (sprite.x + spriteHalfWidth < -halfWidth) {
                    sprite.x = halfWidth + spriteHalfWidth;
                }
                if (sprite.y - spriteHalfHeight > halfHeight) {
                    sprite.y = -halfHeight - spriteHalfHeight;
                }
                if (sprite.y + spriteHalfHeight < -halfHeight) {
                    sprite.y = halfHeight + spriteHalfHeight;
                }

                window.refreshSprite(sprite);
            }
            yield;
        `;
    };
    Blockly.Blocks['motion_turn_right_degrees'] = {
        init: function() {
            this.appendValueInput("DEGREES").setCheck("Number")
                .appendField(new Blockly.FieldImage("https://github.com/codejredu/test/raw/main/assets/blocklyicon/right.png", 34, 34, { alt: "turn right icon", flipRtl: false }))
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("סובב את הדמות ימינה.");
        }
    };
    Blockly.JavaScript['motion_turn_right_degrees'] = function(block) {
        const degrees = Blockly.JavaScript.valueToCode(block, 'DEGREES', Blockly.JavaScript.ORDER_ATOMIC) || '15';
        return `
            if (sprite) {
                sprite.direction += Number(${degrees});
                window.refreshSprite(sprite);
            }
            yield;
        `;
    };
    Blockly.Blocks['motion_turn_left_degrees'] = {
        init: function() {
            this.appendValueInput("DEGREES").setCheck("Number")
                .appendField(new Blockly.FieldImage("https://github.com/codejredu/test/raw/main/assets/blocklyicon/left.png", 34, 34, { alt: "turn left icon", flipRtl: false }))
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("סובב את הדמות שמאלה.");
        }
    };
    Blockly.JavaScript['motion_turn_left_degrees'] = function(block) {
        const degrees = Blockly.JavaScript.valueToCode(block, 'DEGREES', Blockly.JavaScript.ORDER_ATOMIC) || '15';
        return `
            if (sprite) {
                sprite.direction -= Number(${degrees});
                window.refreshSprite(sprite);
            }
            yield;
        `;
    };
    
    Blockly.Blocks['motion_set_direction'] = {
        init: function() {
            const angleValidator = (newValue) => {
                 if (getActiveSprite()) {
                    let sprite = getActiveSprite();
                    sprite.direction = Number(newValue);
                    window.refreshSprite(sprite);
                }
                return newValue;
            };

            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/compass.svg", 34, 34, { alt: "compass icon", flipRtl: false }))
                .appendField(new Blockly.FieldAngle('90', angleValidator), 'DEGREES')
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("קבע את כיוון הדמות.");
        }
    };
    Blockly.JavaScript['motion_set_direction'] = function(block) {
        const degrees = block.getFieldValue('DEGREES');
        return `
            if (sprite) {
                sprite.direction = Number(${degrees});
                window.refreshSprite(sprite);
                log(sprite.name + ' קבעה כיוון ל-' + sprite.direction + ' מעלות.');
            }
            yield;
        `;
    };
    
    Blockly.Blocks['looks_say_for_secs'] = {
        init: function() {
            this.appendValueInput("MESSAGE").setCheck("String").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/say.png", 34, 34, { alt: "say icon", flipRtl: false }));
            this.appendValueInput("SECS").setCheck("Number").setAlign(Blockly.ALIGN_RIGHT);
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("גרום לדמות לומר הודעה למשך מספר שניות.");
        }
    };
    Blockly.JavaScript['looks_say_for_secs'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || "''";
        const secs = Blockly.JavaScript.valueToCode(block, 'SECS', Blockly.JavaScript.ORDER_ATOMIC) || '2';
        // Sanitize the block ID to create a valid JavaScript variable name.
        const varName = `endTime_${block.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return `
            if (sprite) {
                const spriteEl = document.getElementById(sprite.id);
                if (spriteEl) {
                    const bubble = spriteEl.querySelector('.speech-bubble');
                    bubble.textContent = ${message};
                    bubble.classList.add('visible');
                    log(sprite.name + ' אומרת: ' + ${message});
                    
                    const ${varName} = Date.now() + (${secs}) * 1000;
                    while (Date.now() < ${varName}) {
                        if (getExecutionCancelled()) break;
                        yield;
                    }

                    if (!getExecutionCancelled()) {
                         bubble.classList.remove('visible');
                    }
                }
            }
        `;
    };
    Blockly.Blocks['looks_say'] = {
        init: function() {
            this.appendValueInput("MESSAGE").setCheck("String").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/say.png", 34, 34, { alt: "say icon", flipRtl: false }));
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("גרום לדמות לומר הודעה.");
        }
    };
    Blockly.JavaScript['looks_say'] = function(block) {
        const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || "''";
        return `
            if (sprite) {
                const spriteEl = document.getElementById(sprite.id);
                if (spriteEl) {
                   const bubble = spriteEl.querySelector('.speech-bubble');
                   bubble.textContent = ${message};
                   bubble.classList.add('visible');
                   log(sprite.name + ' אומרת: ' + ${message});
                }
            }
        `;
    };
    Blockly.Blocks['looks_show'] = {
        init: function() {
            this.appendDummyInput().appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/show.png", 34, 34, { alt: "show icon", flipRtl: false })).appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("הצג את הדמות.");
        }
    };
    Blockly.JavaScript['looks_show'] = function(block) {
        return `
            if (sprite) {
                sprite.opacity = 1;
                window.refreshSprite(sprite);
                log(sprite.name + ' הוצגה.');
            }
            yield;
        `;
    };
    Blockly.Blocks['looks_hide'] = {
        init: function() {
            this.appendDummyInput().appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/hide.png", 34, 34, { alt: "hide icon", flipRtl: false })).appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("הסתר את הדמות.");
        }
    };
    Blockly.JavaScript['looks_hide'] = function(block) {
        return `
            if (sprite) {
                sprite.opacity = 0;
                window.refreshSprite(sprite);
                log(sprite.name + ' הוסתרה.');
            }
            yield;
        `;
    };

    Blockly.Blocks['looks_grow'] = {
        init: function() {
            this.appendValueInput("SIZE")
                .setCheck("Number")
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/increase.svg", 34, 34, "*"));
            this.appendDummyInput().appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("הגדל את הדמות.");
        }
    };
    Blockly.JavaScript['looks_grow'] = function(block) {
        const size = Blockly.JavaScript.valueToCode(block, 'SIZE', Blockly.JavaScript.ORDER_ATOMIC) || '10';
        return `
            if (sprite) {
                sprite.size += Number(${size});
                window.refreshSprite(sprite);
                log(sprite.name + ' גדלה לגודל ' + sprite.size);
            }
            yield;
        `;
    };
    
    Blockly.Blocks['looks_shrink'] = {
        init: function() {
            this.appendValueInput("SIZE")
                .setCheck("Number")
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/decrease.svg", 34, 34, "*"));
            this.appendDummyInput().appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("הקטן את הדמות.");
        }
    };
    Blockly.JavaScript['looks_shrink'] = function(block) {
        const size = Blockly.JavaScript.valueToCode(block, 'SIZE', Blockly.JavaScript.ORDER_ATOMIC) || '10';
        return `
            if (sprite) {
                sprite.size = Math.max(5, sprite.size - Number(${size})); // Don't let size go below 5
                window.refreshSprite(sprite);
                log(sprite.name + ' קטנה לגודל ' + sprite.size);
            }
            yield;
        `;
    };

    Blockly.Blocks['looks_set_size'] = {
        init: function() {
            this.appendValueInput("SIZE")
                .setCheck("Number")
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/equal.svg", 34, 34, "*"));
            this.appendDummyInput().appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("קובע את גודל הדמות באחוזים.");
        }
    };
    Blockly.JavaScript['looks_set_size'] = function(block) {
        const size = Blockly.JavaScript.valueToCode(block, 'SIZE', Blockly.JavaScript.ORDER_ATOMIC) || '100';
        return `
            if (sprite) {
                sprite.size = Math.max(5, Number(${size})); // Don't let size go below 5
                window.refreshSprite(sprite);
                log(sprite.name + ' קבע גודל ל-' + sprite.size);
            }
            yield;
        `;
    };

    // Custom field for backdrop selection
    class FieldBackdrop extends Blockly.FieldDropdown {
        constructor() {
            // We pass a function that will be called by Blockly when it needs the options.
            super(FieldBackdrop.generateOptions);
        }

        static generateOptions() {
            const backdropElements = document.querySelectorAll('#backdrops-list .backdrop-card');
            if (!backdropElements || backdropElements.length === 0) {
                return [['(אין רקעים)', 'NONE']];
            }
            
            const options = Array.from(backdropElements).map((card) => {
                const url = card.dataset.url;
                const name = url.substring(url.lastIndexOf('/') + 1).replace(/\.(svg|png|jpg|jpeg)$/i, '');
                return [
                    {
                        src: url,
                        width: 48, // Thumbnail width
                        height: 36, // Thumbnail height
                        alt: name,
                    },
                    url // The value for this option is the URL string
                ];
            });
            
            return options.length > 0 ? options : [['(אין רקעים)', 'NONE']];
        }

        // Override to show image in the block itself
        initView() {
            super.initView();
            this.imageElement_ = Blockly.utils.dom.createSvgElement('image', {
                'height': '36px',
                'width': '48px',
                'y': -10, // Adjust vertical position
                'x': 5
            }, this.fieldGroup_);
            this.updateImageView_();
        }

        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            this.updateImageView_();
        }

        updateImageView_() {
            if (this.value_ && this.imageElement_ && this.value_ !== 'NONE') {
                this.imageElement_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', this.value_);
                 if (this.textElement_) {
                   this.textElement_.style.display = 'none';
                }
            } else if (this.imageElement_) {
                this.imageElement_.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '');
                 if (this.textElement_) {
                   this.textElement_.style.display = 'block';
                }
            }
        }
    }
    Blockly.fieldRegistry.register('field_backdrop', FieldBackdrop);

    Blockly.Blocks['looks_switch_backdrop'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/bg/bgimage.svg", 34, 34, "*"))
                .appendField(new FieldBackdrop(), 'BACKDROP')
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("משנה את הרקע של הבמה.");
        }
    };
     Blockly.JavaScript['looks_switch_backdrop'] = function(block) {
        const backdropUrl = block.getFieldValue('BACKDROP');
        if (backdropUrl && backdropUrl !== 'NONE') {
            const safeUrl = backdropUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
            return `
                window.switchBackdrop('${safeUrl}');
                yield;
            `;
        }
        return ''; // Do nothing if no backdrop is selected
    };

    Blockly.Blocks['looks_change_layer'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/layers.svg", 34, 34, { alt: "layers icon", flipRtl: false }))
                .appendField(new Blockly.FieldDropdown([
                    [{ src: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M12 19V5'/><path d='m5 12 7-7 7 7'/></svg>`, width: 24, height: 24, alt: 'אחת קדימה' }, 'FORWARD'],
                    [{ src: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M12 5v14'/><path d='m19 12-7 7-7-7'/></svg>`, width: 24, height: 24, alt: 'אחת אחורה' }, 'BACKWARD'],
                    [{ src: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='m17 11-5-5-5 5'/><path d='m17 18-5-5-5 5'/></svg>`, width: 24, height: 24, alt: 'לקדמה' }, 'FRONT'],
                    [{ src: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='m7 13 5 5 5-5'/><path d='m7 6 5 5 5-5'/></svg>`, width: 24, height: 24, alt: 'לאחור' }, 'BACK']
                ]), "ACTION")
                .appendField('\u00A0'.repeat(10));
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#9966FF");
            this.setTooltip("שנה את סדר השכבות של הדמות.");
        }
    };

    Blockly.JavaScript['looks_change_layer'] = function(block) {
        const action = block.getFieldValue('ACTION');
        return `window.changeSpriteLayer(sprite, '${action}'); yield;`;
    };
    
    Blockly.Blocks['control_wait_secs'] = {
        init: function() {
            this.appendValueInput("SECS").setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/wait.svg", 34, 34, "*"));
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#FF6B1A");
            this.setTooltip("המתן למשך מספר שניות.");
        }
    };
    Blockly.JavaScript['control_wait_secs'] = function(block) {
        const secs = Blockly.JavaScript.valueToCode(block, 'SECS', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        // Sanitize the block ID to create a valid JavaScript variable name.
        const varName = `endTime_${block.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return `
            log('המתנה של ' + (${secs}) + ' שניות...');
            const ${varName} = Date.now() + (${secs}) * 1000;
            while (Date.now() < ${varName}) {
                if (getExecutionCancelled()) break;
                yield;
            }
        `;
    };

    Blockly.Blocks['control_repeat_times'] = {
        init: function() {
            this.appendValueInput("TIMES")
                .setCheck("Number")
                .appendField('\u00A0\u00A0\u00A0\u00A0')
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/repeat.svg", 24, 24, "*"));
            this.appendDummyInput().appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.appendStatementInput("DO").setCheck(null);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#FF6B1A");
            this.setTooltip("חזור על הבלוקים שבפנים מספר פעמים.");
        }
    };
    Blockly.JavaScript['control_repeat_times'] = function(block) {
        const times = Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC) || '10';
        const branch = Blockly.JavaScript.statementToCode(block, 'DO');
        return `
            for (let i = 0; i < (${times}); i++) {
                if (getExecutionCancelled()) break;
                log('חזרה מספר: ' + (i + 1));
                ${branch}
                if (getExecutionCancelled()) break;
            }
        `;
    };

    Blockly.Blocks['control_forever'] = {
        init: function() {
            this.appendDummyInput()
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0')
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/forever.svg", 36, 36, "*"));
            this.appendStatementInput("DO").setCheck(null);
            this.setPreviousStatement(true, null);
            this.setColour("#FF6B1A");
            this.setTooltip("חזור על הבלוקים שבפנים לנצח.");
        }
    };
    Blockly.JavaScript['control_forever'] = function(block) {
        const branch = Blockly.JavaScript.statementToCode(block, 'DO');
        return `
            while(!getExecutionCancelled()) {
                ${branch}
                yield;
            }
        `;
    };

    Blockly.Blocks['motion_go_to_xy'] = {
        init: function() {
            this.appendValueInput("X").setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/iconsx.svg", 24, 24, "X"));
            this.appendValueInput("Y").setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/iconsy.svg", 24, 24, "Y"));
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("הזז את הדמות למיקום ספציפי על הבמה.");
        }
    };
    Blockly.JavaScript['motion_go_to_xy'] = function(block) {
        const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `
            if (sprite) {
                sprite.x = (${x});
                sprite.y = (${y});
                window.refreshSprite(sprite);
                log(sprite.name + ' עברה למיקום: ' + sprite.x.toFixed(0) + ', ' + sprite.y.toFixed(0));
            }
            yield;
        `;
    };
    Blockly.Blocks['motion_glide_to_xy'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/surffingEmoji.svg", 34, 34, "גלוש"));
            this.appendValueInput("SECS")
                .setCheck("Number")
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/wait.svg", 24, 24, "שניות"));
            this.appendValueInput("X")
                .setCheck("Number")
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/iconsx.svg", 24, 24, "X"));
            this.appendValueInput("Y")
                .setCheck("Number")
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/iconsy.svg", 24, 24, "Y"));
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("החלק את הדמות בצורה חלקה למיקום ספציפי.");
        }
    };
    Blockly.JavaScript['motion_glide_to_xy'] = function(block) {
        const secs = Blockly.JavaScript.valueToCode(block, 'SECS', Blockly.JavaScript.ORDER_ATOMIC) || '1';
        const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `
            if (sprite) {
                const startX = sprite.x;
                const startY = sprite.y;
                const endX = (${x});
                const endY = (${y});
                const durationMs = Math.max(0, (${secs}) * 1000);
                const startTime = Date.now();
                let elapsedTime = 0;

                while (elapsedTime < durationMs) {
                    if (getExecutionCancelled()) break;
                    
                    elapsedTime = Date.now() - startTime;
                    const progress = Math.min(1, elapsedTime / durationMs);
                    
                    sprite.x = startX + (endX - startX) * progress;
                    sprite.y = startY + (endY - startY) * progress;
                    
                    window.refreshSprite(sprite);
                    yield;
                }
                
                if (!getExecutionCancelled()) {
                    sprite.x = endX;
                    sprite.y = endY;
                    window.refreshSprite(sprite);
                    log(sprite.name + ' סיימה לגלוש.');
                }
            }
        `;
    };

    Blockly.Blocks['motion_jump'] = {
        init: function() {
            this.appendValueInput("HEIGHT")
                .setCheck("Number")
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/jump.svg", 34, 34, { alt: "jump icon", flipRtl: false }))
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("גורם לדמות לקפוץ לגובה מסוים.");
        }
    };

    Blockly.JavaScript['motion_jump'] = function(block) {
        const height = Blockly.JavaScript.valueToCode(block, 'HEIGHT', Blockly.JavaScript.ORDER_ATOMIC) || '100';
        return `
            if (sprite) {
                const JUMP_HEIGHT = (${height});
                const DURATION_MS = 500;
                const startY = sprite.y;
                const startTime = Date.now();
                let elapsedTime = 0;
                log(sprite.name + ' מתחילה לקפוץ...');

                while (elapsedTime < DURATION_MS) {
                     if (getExecutionCancelled()) {
                        sprite.y = startY;
                        break;
                    }
                    elapsedTime = Date.now() - startTime;
                    const progress = Math.min(1, elapsedTime / DURATION_MS);
                    
                    // Parabolic function for jump arc: y = -4h * x * (x - 1)
                    // where h is height and x is progress (0 to 1)
                    const parabolicProgress = -4 * JUMP_HEIGHT * progress * (progress - 1);
                    sprite.y = startY + parabolicProgress;
                    
                    window.refreshSprite(sprite);
                    yield;
                }

                if (!getExecutionCancelled()) {
                    sprite.y = startY;
                    window.refreshSprite(sprite);
                    log(sprite.name + ' סיימה לקפוץ.');
                }
            }
        `;
    };

    Blockly.Blocks['operator_add'] = {
        init: function() {
            this.setOutput(true, "Number");
            this.setColour("#40BF4A");
            this.setTooltip("החזרת סכום שני מספרים.");
            this.appendValueInput("B").setCheck("Number");
            this.appendDummyInput().appendField('+');
            this.appendValueInput("A").setCheck("Number");
            this.setInputsInline(true);
        }
    };
    Blockly.JavaScript['operator_add'] = function(block) {
        const a = Blockly.JavaScript.valueToCode(block, 'A', Blockly.JavaScript.ORDER_ADDITION) || '0';
        const b = Blockly.JavaScript.valueToCode(block, 'B', Blockly.JavaScript.ORDER_ADDITION) || '0';
        const code = `(${a} + ${b})`;
        return [code, Blockly.JavaScript.ORDER_ADDITION];
    };

    Blockly.Blocks['operator_subtract'] = {
        init: function() {
            this.setOutput(true, "Number");
            this.setColour("#40BF4A");
            this.setTooltip("החזרת ההפרש בין שני מספרים.");
            this.appendValueInput("B").setCheck("Number");
            this.appendDummyInput().appendField('-');
            this.appendValueInput("A").setCheck("Number");
            this.setInputsInline(true);
        }
    };
    Blockly.JavaScript['operator_subtract'] = function(block) {
        const a = Blockly.JavaScript.valueToCode(block, 'A', Blockly.JavaScript.ORDER_SUBTRACTION) || '0';
        const b = Blockly.JavaScript.valueToCode(block, 'B', Blockly.JavaScript.ORDER_SUBTRACTION) || '0';
        const code = `(${a} - ${b})`;
        return [code, Blockly.JavaScript.ORDER_SUBTRACTION];
    };

    Blockly.Blocks['operator_multiply'] = {
        init: function() {
            this.setOutput(true, "Number");
            this.setColour("#40BF4A");
            this.setTooltip("החזרת המכפלה של שני מספרים.");
            this.appendValueInput("B").setCheck("Number");
            this.appendDummyInput().appendField('*');
            this.appendValueInput("A").setCheck("Number");
            this.setInputsInline(true);
        }
    };
    Blockly.JavaScript['operator_multiply'] = function(block) {
        const a = Blockly.JavaScript.valueToCode(block, 'A', Blockly.JavaScript.ORDER_MULTIPLICATION) || '0';
        const b = Blockly.JavaScript.valueToCode(block, 'B', Blockly.JavaScript.ORDER_MULTIPLICATION) || '0';
        const code = `(${a} * ${b})`;
        return [code, Blockly.JavaScript.ORDER_MULTIPLICATION];
    };

    Blockly.Blocks['operator_divide'] = {
        init: function() {
            this.setOutput(true, "Number");
            this.setColour("#40BF4A");
            this.setTooltip("החזרת תוצאת החילוק של שני מספרים.");
            this.appendValueInput("B").setCheck("Number");
            this.appendDummyInput().appendField('/');
            this.appendValueInput("A").setCheck("Number");
            this.setInputsInline(true);
        }
    };
    Blockly.JavaScript['operator_divide'] = function(block) {
        const a = Blockly.JavaScript.valueToCode(block, 'A', Blockly.JavaScript.ORDER_DIVISION) || '0';
        const b = Blockly.JavaScript.valueToCode(block, 'B', Blockly.JavaScript.ORDER_DIVISION) || '1';
        const code = `(${a} / ${b})`;
        return [code, Blockly.JavaScript.ORDER_DIVISION];
    };

    Blockly.Blocks['operator_random_number'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/random.svg", 34, 34, "*"))
                .appendField(new FieldCustomNumber(1), "FROM")
                .appendField(new FieldCustomNumber(10), "TO");
            this.setInputsInline(true);
            this.setOutput(true, "Number");
            this.setColour("#40BF4A");
            this.setTooltip("החזרת מספר שלם אקראי בין שני מספרים.");
        }
    };
    Blockly.JavaScript['operator_random_number'] = function(block) {
        const from = block.getFieldValue('FROM');
        const to = block.getFieldValue('TO');
        const code = `Math.floor(Math.random() * (${to} - ${from} + 1)) + ${from}`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Custom field for sound selection
    class FieldSound extends Blockly.FieldDropdown {
        constructor() {
            super(FieldSound.generateOptions);
        }

        static generateOptions() {
            const sprite = getActiveSprite();
            if (!sprite || !sprite.sounds || sprite.sounds.length === 0) {
                return [['(אין צלילים)', 'NONE']];
            }
            return sprite.sounds.map(sound => [sound.name, sound.url]);
        }
    }
    Blockly.fieldRegistry.register('field_sound', FieldSound);
    
    Blockly.Blocks['sound_play_until_done'] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldImage("https://codejredu.github.io/test/assets/blocklyicon/audio.svg", 34, 34, "*"))
                .appendField(new FieldSound(), "SOUND")
                .appendField('\u00A0\u00A0\u00A0\u00A0\u00A0');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#CF63CF");
            this.setTooltip("מנגן צליל ומחכה לסיומו.");
        }
    };

    Blockly.JavaScript['sound_play_until_done'] = function(block) {
        const soundUrl = block.getFieldValue('SOUND');
        if (!soundUrl || soundUrl === 'NONE') return '';
        
        const safeUrl = soundUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `
            log('מנגן צליל: ${safeUrl}');
            const audio = new Audio('${safeUrl}');
            let soundEnded = false;
            const endListener = () => { soundEnded = true; };
            audio.addEventListener('ended', endListener);
            audio.addEventListener('error', endListener);
            audio.play().catch(e => { console.error('Audio play failed:', e); soundEnded = true; });
            
            while (!soundEnded) {
                if (getExecutionCancelled()) {
                    audio.pause();
                    audio.removeEventListener('ended', endListener);
                    audio.removeEventListener('error', endListener);
                    break;
                }
                yield;
            }
            log('הצליל הסתיים.');
        `;
    };

    
    // Configure Blockly's angle picker to match Scratch
    // 0 is up, clockwise
    Blockly.FieldAngle.OFFSET = 90;
    Blockly.FieldAngle.CLOCKWISE = true;
    
    workspace = Blockly.inject('blockly-area', {
        toolbox: document.getElementById('toolbox'),
        rtl: true,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        renderer: 'zelos',
        theme: Blockly.Themes.Scratch
    });
    
    try {
        const mainBackground = document.querySelector('#blockly-area .blocklyMainBackground');
        if (mainBackground) {
            mainBackground.setAttribute('fill', 'url(#blockly-bg-pattern)');
        }
    } catch (e) {
        console.error("Could not apply Blockly background pattern:", e);
    }
    
    const toolbox = workspace.getToolbox();
    if (toolbox) {
        // Prevent the flyout (block menu) from closing when a block is dragged out.
        // This provides a more Scratch-like experience.
        const flyout = toolbox.getFlyout();
        if (flyout) {
            flyout.autoClose = false;
        }

        // Prevent the toolbox from clearing the category selection when the workspace is clicked.
        // This keeps the currently selected category visually highlighted.
        toolbox.clearSelection = () => {
            // Do nothing, overriding the default behavior.
        };
    }

    workspace.addChangeListener((event) => {
        if (event.type === Blockly.Events.BLOCK_MOVE) {
            const numberPad = document.getElementById('number-pad-container');
            if (numberPad.style.display === 'block' && numberPad.currentField) {
                const fieldBlockId = numberPad.currentField.getSourceBlock().id;
                if (event.blockId === fieldBlockId) {
                    positionNumberPad(numberPad.currentField);
                }
            }
        }
    });

    const getExecutionCancelled = () => executionCancelled;

    function showBlockValue(block) {
        // Generate code for the single block
        const codeArray = Blockly.JavaScript.blockToCode(block);
        if (!codeArray || typeof codeArray[0] !== 'string') return;

        const expression = codeArray[0];
        let value;
        try {
            // Safely evaluate the expression
            value = new Function('return ' + expression)();
            // Round if it's a number with many decimals
            if (typeof value === 'number') {
                value = Math.round(value * 1000) / 1000;
            }
        } catch (e) {
            console.log("Could not evaluate block value:", e);
            value = '?'; // Show a question mark on error
        }

        // Create and position the bubble
        const bubble = document.createElement('div');
        bubble.className = 'value-bubble';
        bubble.textContent = value;
        document.body.appendChild(bubble);

        const rect = block.getSvgRoot().getBoundingClientRect();
        
        // Position bubble centered above the block
        bubble.style.left = `${rect.left + rect.width / 2}px`;
        bubble.style.top = `${rect.top}px`;

        // Fade out and remove the bubble
        setTimeout(() => {
            bubble.style.opacity = '0';
            setTimeout(() => {
                if (bubble.parentElement) {
                    bubble.remove();
                }
            }, 400); // Wait for fade-out animation
        }, 1200); // Display for 1.2 seconds
    }

    function createGeneratorForStack(startBlock, sprite) {
        let code = '';
        let currentBlock = startBlock.getNextBlock();
        while (currentBlock) {
            code += Blockly.JavaScript.blockToCode(currentBlock);
            if (getExecutionCancelled()) break;
            currentBlock = currentBlock.getNextBlock();
        }

        if (!code) return null;

        // The generated code will access window.frameDeltaTime, which is updated every tick.
        const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
        const func = new GeneratorFunction('sprite', 'log', 'getExecutionCancelled', 'window', code);
        
        return func(sprite, log, getExecutionCancelled, window);
    }

    function runScriptStack(startBlock) {
        saveActiveSpriteWorkspace();
        const sprite = getActiveSprite();
        if (!sprite) {
            log("No active sprite to run script.");
            return;
        }
        
        const generator = createGeneratorForStack(startBlock, sprite);
        if (generator) {
            if (!scriptRunner || !scriptRunner.isRunning) {
                 scriptRunner = new ScriptRunner(stopAllScripts);
                 document.getElementById('run-button').classList.add('hidden');
                 document.getElementById('reset-button').classList.remove('hidden');
                 fullscreenRunButton.classList.add('hidden');
                 fullscreenResetButton.classList.remove('hidden');
            }
            scriptRunner.add(generator);
        }
    }

    function executeBlock(blockId) {
        const block = workspace.getBlockById(blockId);
        if (!block || block.type.startsWith('event_')) return;
        
        log(`מפעיל בלוק בודד: ${block.type}`);
        
        const code = Blockly.JavaScript.blockToCode(block);
        const sprite = getActiveSprite();
        const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
        // The generated code will access window.frameDeltaTime, which is updated every tick.
        const func = new GeneratorFunction('sprite', 'log', 'getExecutionCancelled', 'window', code);
        const generator = func(sprite, log, getExecutionCancelled, window);
        
        if (!scriptRunner || !scriptRunner.isRunning) {
            scriptRunner = new ScriptRunner(stopAllScripts);
            document.getElementById('run-button').classList.add('hidden');
            document.getElementById('reset-button').classList.remove('hidden');
            fullscreenRunButton.classList.add('hidden');
            fullscreenResetButton.classList.remove('hidden');
        }
        scriptRunner.add(generator);
    }
    
    const blocklyDiv = document.getElementById('blockly-area');
    blocklyDiv.addEventListener('click', (event) => {
        if (scriptRunner && scriptRunner.isRunning) return;
        const blocklyBlockSvg = event.target.closest('.blocklyDraggable');
        if (blocklyBlockSvg) {
            const blockId = blocklyBlockSvg.getAttribute('data-id');
            if (blockId) {
                const block = workspace.getBlockById(blockId);
                if (!block) return;

                if (block.previousConnection === null && block.getParent() === null) {
                    if (block.type === 'event_when_flag_clicked') {
                        log('לחיצה על בלוק הדגל הירוק, מפעיל את כל התסריטים.');
                        runCode();
                        return;
                    }
                    if (['event_when_sprite_clicked', 'event_when_bump', 'event_when_key_pressed'].includes(block.type)) {
                        runScriptStack(block);
                        return; 
                    }
                }
                
                if (!block.outputConnection && block.getParent() === null) {
                     executeBlock(blockId);
                } 
                else if (block.outputConnection) {
                    showBlockValue(block);
                }
            }
        }
    });

    document.getElementById('run-button').addEventListener('click', runCode);
    document.getElementById('reset-button').addEventListener('click', stopAllScripts);
    fullscreenRunButton.addEventListener('click', runCode);
    fullscreenResetButton.addEventListener('click', stopAllScripts);
    
    fullscreenButton.addEventListener('click', () => {
        containerWrapper.classList.toggle('stage-expanded');
        const isExpanded = containerWrapper.classList.contains('stage-expanded');
        
        enterFullscreenIcon.classList.toggle('hidden', isExpanded);
        exitFullscreenIcon.classList.toggle('hidden', !isExpanded);
        
        if (isExpanded) {
            fullscreenButton.title = 'צא ממסך מלא'; // Exit fullscreen
        } else {
            fullscreenButton.title = 'מסך מלא'; // Fullscreen
        }
        
        setTimeout(() => {
            window.dispatchEvent(new Event('resize')); 
        }, 300);
    });

    let gridIsDrawn = false;
    function drawGrid() {
        if (gridIsDrawn) return;

        const ctx = gridCanvas.getContext('2d');
        const width = STAGE_WIDTH;
        const height = STAGE_HEIGHT;
        gridCanvas.width = width;
        gridCanvas.height = height;

        const centerX = width / 2;
        const centerY = height / 2;
        const step = 40;

        ctx.clearRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 0.5;
        for (let x = centerX + step; x < width; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let x = centerX - step; x > 0; x -= step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = centerY + step; y < height; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        for (let y = centerY - step; y > 0; y -= step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();

        // Labels
        ctx.fillStyle = '#555555';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText('0', centerX + 15, centerY + 15);
        ctx.textAlign = 'right';
        ctx.fillText(String(STAGE_WIDTH / 2), width - 5, centerY + 15);
        ctx.textAlign = 'left';
        ctx.fillText(String(-STAGE_WIDTH / 2), 5, centerY + 15);
        ctx.textAlign = 'center';
        ctx.fillText(String(STAGE_HEIGHT / 2), centerX + 20, 15);
        ctx.fillText(String(-STAGE_HEIGHT / 2), centerX + 25, height - 15);
        
        gridIsDrawn = true;
    }

    toggleGridButton.addEventListener('click', () => {
        const isVisible = !gridCanvas.classList.contains('hidden');
        if (isVisible) {
            gridCanvas.classList.add('hidden');
            toggleGridButton.classList.remove('active');
            toggleGridButton.title = 'הצג רשת';
        } else {
            drawGrid(); // Will only draw once
            gridCanvas.classList.remove('hidden');
            toggleGridButton.classList.add('active');
            toggleGridButton.title = 'הסתר רשת';
        }
    });


    function saveActiveSpriteWorkspace() {
         if (activeSpriteId && sprites[activeSpriteId]) {
            const dom = Blockly.Xml.workspaceToDom(workspace);
            sprites[activeSpriteId].workspaceXml = Blockly.Xml.domToText(dom);
        }
    }
    
    function runCode() {
        if (scriptRunner && scriptRunner.isRunning) {
            log('תסריט כבר רץ. לחץ על עצור לפני הפעלה מחדש.');
            return;
        }

        document.getElementById('run-button').classList.add('hidden');
        document.getElementById('reset-button').classList.remove('hidden');
        fullscreenRunButton.classList.add('hidden');
        fullscreenResetButton.classList.remove('hidden');
        
        saveActiveSpriteWorkspace();
        scriptRunner = new ScriptRunner(stopAllScripts);
        
        log('התסריט הופעל.');

        Object.values(sprites).forEach(sprite => {
            if (sprite.isGif && sprite.animation) {
                sprite.animation.isPlaying = true;
                sprite.animation.previewIsPlaying = false;
                sprite.animation.currentFrame = 0;
                updatePropertiesPanel(); // Update play/pause button state
            }
        });

        let scriptsFound = false;
        Object.values(sprites).forEach(sprite => {
            if (sprite.workspaceXml) {
                const tempWorkspace = new Blockly.Workspace();
                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(sprite.workspaceXml), tempWorkspace);
                const topBlocks = tempWorkspace.getTopBlocks(true);
                const flagClickScripts = topBlocks.filter(block => block.type === 'event_when_flag_clicked');
                
                flagClickScripts.forEach(startBlock => {
                   const generator = createGeneratorForStack(startBlock, sprite);
                   if (generator) {
                       scriptRunner.add(generator);
                       scriptsFound = true;
                   }
                });
                tempWorkspace.dispose();
            }
        });

        if(!scriptsFound) {
             log('לא נמצאו תסריטים שמתחילים בדגל ירוק.');
             scriptRunner.stop(); // Stop immediately if no scripts to run
             stopAllScripts(); // Also reset UI
        }
    }
    
    window.addEventListener('kidi-broadcast', (e) => {
        const message = e.detail.message;
        log(`התקבל מסר: ${message}`);
        runBroadcastScripts(message);
    });

    function runBroadcastScripts(message) {
        saveActiveSpriteWorkspace();
        if (!scriptRunner || !scriptRunner.isRunning) {
            scriptRunner = new ScriptRunner(stopAllScripts);
            document.getElementById('run-button').classList.add('hidden');
            document.getElementById('reset-button').classList.remove('hidden');
            fullscreenRunButton.classList.add('hidden');
            fullscreenResetButton.classList.remove('hidden');
        }

        Object.values(sprites).forEach(sprite => {
            if (!sprite.workspaceXml) return;
            
            const tempWorkspace = new Blockly.Workspace();
            try {
                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(sprite.workspaceXml), tempWorkspace);
                const topBlocks = tempWorkspace.getTopBlocks(true);
                
                const matchingHatBlocks = topBlocks.filter(block => 
                    block.type === 'event_when_broadcast_received' && 
                    block.getFieldValue('MESSAGE') === message
                );
                
                matchingHatBlocks.forEach(startBlock => {
                    const generator = createGeneratorForStack(startBlock, sprite);
                    if(generator) scriptRunner.add(generator);
                });
                
            } catch (err) {
                console.error("Error processing workspace for broadcast:", err);
            } finally {
                tempWorkspace.dispose();
            }
        });
    }


    function handleSpriteClick(spriteId) {
        saveActiveSpriteWorkspace();
        const sprite = sprites[spriteId];
        if (!sprite || !sprite.workspaceXml) return;

        if (!scriptRunner || !scriptRunner.isRunning) {
            scriptRunner = new ScriptRunner(stopAllScripts);
             document.getElementById('run-button').classList.add('hidden');
             document.getElementById('reset-button').classList.remove('hidden');
             fullscreenRunButton.classList.add('hidden');
             fullscreenResetButton.classList.remove('hidden');
        }
        
        const tempWorkspace = new Blockly.Workspace();
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(sprite.workspaceXml), tempWorkspace);
        const topBlocks = tempWorkspace.getTopBlocks(true);
        const clickScripts = topBlocks.filter(block => block.type === 'event_when_sprite_clicked');

        clickScripts.forEach(startBlock => {
            const generator = createGeneratorForStack(startBlock, sprite);
            if (generator) scriptRunner.add(generator);
        });
        tempWorkspace.dispose();
    }
    
     // --- Collision Detection and Handling ---
    function checkCollisions() {
        if (isLoadingProject) return;

        const spriteIds = Object.keys(sprites);
        if (spriteIds.length < 2) return;

        for (let i = 0; i < spriteIds.length; i++) {
            for (let j = i + 1; j < spriteIds.length; j++) {
                const id1 = spriteIds[i];
                const id2 = spriteIds[j];
                
                const el1 = document.getElementById(id1);
                const el2 = document.getElementById(id2);
                
                if (!el1 || !el2 || sprites[id1].opacity === 0 || sprites[id2].opacity === 0) continue;
                
                const rect1 = el1.getBoundingClientRect();
                const rect2 = el2.getBoundingClientRect();

                const isColliding = !(rect1.right < rect2.left || 
                                      rect1.left > rect2.right || 
                                      rect1.bottom < rect2.top || 
                                      rect1.top > rect2.bottom);
                
                const collisionKey = [id1, id2].sort().join('-');

                if (isColliding) {
                    if (!collisionState.has(collisionKey)) {
                        collisionState.add(collisionKey);
                        log(`התנגשות בין ${sprites[id1].name} ל-${sprites[id2].name}`);
                        triggerBumpScripts(id1, id2);
                    }
                } else {
                    if (collisionState.has(collisionKey)) {
                        collisionState.delete(collisionKey);
                        log(`${sprites[id1].name} ו-${sprites[id2].name} נפרדו.`);
                    }
                }
            }
        }
    }

    function triggerBumpScripts(id1, id2) {
        saveActiveSpriteWorkspace();
        if (!scriptRunner || !scriptRunner.isRunning) {
            scriptRunner = new ScriptRunner(stopAllScripts);
            document.getElementById('run-button').classList.add('hidden');
            document.getElementById('reset-button').classList.remove('hidden');
            fullscreenRunButton.classList.add('hidden');
            fullscreenResetButton.classList.remove('hidden');
        }

        const runForSprite = (spriteToCheck, otherSpriteId) => {
            if (!spriteToCheck.workspaceXml) return;
            const tempWorkspace = new Blockly.Workspace();
            try {
                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(spriteToCheck.workspaceXml), tempWorkspace);
                const bumpScripts = tempWorkspace.getTopBlocks(true).filter(block => block.type === 'event_when_bump');
                
                bumpScripts.forEach(scriptBlock => {
                    const targetSpriteId = scriptBlock.getFieldValue('TARGET_SPRITE');
                    if (targetSpriteId === 'ANY' || targetSpriteId === otherSpriteId) {
                        const generator = createGeneratorForStack(scriptBlock, spriteToCheck);
                        if (generator) scriptRunner.add(generator);
                    }
                });
            } catch (e) {
                console.error("Error processing bump script workspace", e);
            } finally {
                tempWorkspace.dispose();
            }
        };

        runForSprite(sprites[id1], id2);
        runForSprite(sprites[id2], id1);
    }


    function handleKeyPress(event) {
        const keyMap = { 'SPACE': ' ', 'UP': 'ArrowUp', 'DOWN': 'ArrowDown', 'RIGHT': 'ArrowRight', 'LEFT': 'ArrowLeft' };
        const pressedKey = event.key;
        
        saveActiveSpriteWorkspace();
        if (!scriptRunner || !scriptRunner.isRunning) {
            scriptRunner = new ScriptRunner(stopAllScripts);
             document.getElementById('run-button').classList.add('hidden');
             document.getElementById('reset-button').classList.remove('hidden');
             fullscreenRunButton.classList.add('hidden');
             fullscreenResetButton.classList.remove('hidden');
        }

        Object.values(sprites).forEach(sprite => {
            if (sprite.workspaceXml) {
                const tempWorkspace = new Blockly.Workspace();
                try {
                    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(sprite.workspaceXml), tempWorkspace);
                    const topBlocks = tempWorkspace.getTopBlocks(true);
                    
                    topBlocks.filter(block => block.type === 'event_when_key_pressed' && keyMap[block.getFieldValue('KEY')] === pressedKey)
                        .forEach(startBlock => {
                            const generator = createGeneratorForStack(startBlock, sprite);
                            if (generator) scriptRunner.add(generator);
                        });
                } catch(e) {
                    console.error("Error in handleKeyPress workspace processing:", e);
                } finally {
                    tempWorkspace.dispose();
                }
            }
        });
    }
    document.addEventListener('keydown', handleKeyPress);

    function stopAllScripts() {
        if (scriptRunner) {
            log('עצירת כל התסריטים.');
            scriptRunner.isRunning = false;
            scriptRunner.stop();
        }
        
        Object.values(sprites).forEach(sprite => {
            const bubble = document.querySelector(`#container-${sprite.id} .speech-bubble`);
            if (bubble) bubble.classList.remove('visible');

            if (sprite.isGif && sprite.animation) {
                sprite.animation.isPlaying = false;
                sprite.animation.previewIsPlaying = false;
                sprite.animation.currentFrame = 0;
                drawGifFrame(sprite);
            }
        });

        if (currentPreviewAudio) {
            currentPreviewAudio.pause();
            currentPreviewAudio = null;
        }

        updatePropertiesPanel(); // To update play/pause button state
        
        document.getElementById('run-button').classList.remove('hidden');
        document.getElementById('reset-button').classList.add('hidden');
        fullscreenRunButton.classList.remove('hidden');
        fullscreenResetButton.classList.add('hidden');
    }

    function deleteBackdrop(cardElement) {
        const urlToDelete = cardElement.dataset.url;
        const currentBackdropUrl = stageArea.style.backgroundImage.replace(/url\((['"])?(.*?)\1\)/, '$2');

        const allBackdrops = document.querySelectorAll('#backdrops-list .backdrop-card');
        if (allBackdrops.length <= 1) {
            alert("לא ניתן למחוק את הרקע האחרון.");
            return;
        }

        cardElement.remove();

        if (urlToDelete === currentBackdropUrl) {
            const firstRemainingBackdrop = document.querySelector('#backdrops-list .backdrop-card');
            if (firstRemainingBackdrop) {
                window.switchBackdrop(firstRemainingBackdrop.dataset.url);
            } else {
                stageArea.style.backgroundImage = 'none';
            }
        }
         Blockly.getMainWorkspace().refreshToolboxSelection();
    }
    
    function createBackdropCard(url) {
        const card = document.createElement('div');
        card.classList.add('backdrop-card');
        card.style.backgroundImage = `url("${url}")`;
        card.dataset.url = url;

        const deleteBtn = document.createElement('div');
        deleteBtn.classList.add('delete-button');
        deleteBtn.textContent = 'X';
        card.appendChild(deleteBtn);

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBackdrop(card);
        });

        backdropsList.appendChild(card);
        return card;
    }
    
    function createDefaultBackdrop() {
        const url = "https://codejredu.github.io/test/assets/bg/farm.svg";
        const card = createBackdropCard(url);
        card.classList.add('selected');
        stageArea.style.backgroundImage = `url("${url}")`;
    }

    function createDefaultSprite() {
        const defaultSprite = createNewSprite('חתול', 'https://codejredu.github.io/claudejr/GingerCat.svg', 0, 0);
    }

    function handleBackdropSelection(e) {
        const card = e.target.closest('.backdrop-card');
        if (card && e.target !== card.querySelector('.delete-button')) {
            const url = card.dataset.url;
            if (url) {
               window.switchBackdrop(url);
            }
        }
    }

    function handleGallerySelection(e) {
        const url = e.target.src;
        if (url) {
            const newCard = createBackdropCard(url);
            window.switchBackdrop(url);
            backgroundGallery.classList.remove('visible');
        }
    }

    function handleSpriteGallerySelection(e) {
        const target = e.target;
        if (target.tagName === 'IMG' && target.classList.contains('thumbnail')) {
            const url = target.src;
            const name = target.alt || 'דמות חדשה';
            createNewSprite(name, url, 0, 0);
            spriteGallery.classList.remove('visible');
        }
    }
    
    // Number Pad Logic
    const numberPad = document.getElementById('number-pad-container');
    const numberPadDisplay = document.getElementById('number-pad-display');
    const numberPadGrid = numberPad.querySelector('.number-pad-grid');
    const numberPadDone = document.getElementById('number-pad-done');
    
    numberPadGrid.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const value = e.target.dataset.value;
            let currentDisplay = numberPadDisplay.textContent;

            if (value === 'backspace') {
                numberPadDisplay.textContent = currentDisplay.slice(0, -1);
            } else if (value === '-') {
                if (currentDisplay.startsWith('-')) {
                    numberPadDisplay.textContent = currentDisplay.substring(1);
                } else {
                    numberPadDisplay.textContent = '-' + currentDisplay;
                }
            } else {
                // Prevent multiple decimals
                if (value === '.' && currentDisplay.includes('.')) return;
                numberPadDisplay.textContent += value;
            }
        }
    });

    numberPadDone.addEventListener('click', () => {
        const field = numberPad.currentField;
        if (field) {
            let newValue = parseFloat(numberPadDisplay.textContent);
            if (isNaN(newValue)) {
                newValue = field.getValue(); // Revert to old value if input is invalid
            }
            field.setValue(newValue);
        }
        numberPad.style.display = 'none';
        numberPad.currentField = null;
    });
    
    // Hide number pad when clicking outside
    document.addEventListener('click', (e) => {
        // If the click is not on the number pad and not on a blockly field
        if (numberPad.style.display === 'block' && !numberPad.contains(e.target) && !e.target.closest('.blocklyDraggable')) {
            numberPadDone.click();
        }
    }, true);
    
    // --- Save/Load Project Logic ---
    const saveProject = () => {
        if (activeSpriteId && sprites[activeSpriteId]) {
            const dom = Blockly.Xml.workspaceToDom(workspace);
            sprites[activeSpriteId].workspaceXml = Blockly.Xml.domToText(dom);
        }
        const backdrops = Array.from(document.querySelectorAll('#backdrops-list .backdrop-card')).map(card => card.dataset.url);
        const currentBackdrop = stageArea.style.backgroundImage.replace(/url\((['"])?(.*?)\1\)/, '$2');
        
        // Create a serializable version of sprites
        const serializableSprites = {};
        for (const id in sprites) {
            const { animation, ...rest } = sprites[id]; // Exclude non-serializable animation object
            serializableSprites[id] = rest;
        }

        const projectData = {
            sprites: serializableSprites,
            backdrops: backdrops,
            currentBackdrop: currentBackdrop
        };

        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(dataBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'kidi-project.kidi';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log('הפרויקט נשמר.');
    };

    const loadSpriteFromData = (spriteData) => {
        const { id, name, imageUrl, x, y, direction, opacity, size, rotationStyle, isCustom, characterData, isGif, gifSpeed, sounds, zIndex } = spriteData;

        spriteData.size = size || 100;
        spriteData.rotationStyle = rotationStyle || 'all-around'; // Add for compatibility
        spriteData.isGif = isGif || false;
        spriteData.gifSpeed = gifSpeed || 1.0;
        spriteData.animation = null; // Will be loaded async
        spriteData.sounds = sounds || [];
        spriteData.zIndex = zIndex || nextZIndex++; // Use loaded zIndex or assign a new one
        sprites[id] = spriteData;

        const spriteCard = document.createElement('div');
        spriteCard.classList.add('sprite-card');
        spriteCard.dataset.spriteId = id;
        spriteCard.innerHTML = `
            <img src="${imageUrl}" alt="${name}">
            <div class="delete-button">X</div>
             ${isCustom ? `
                <div class="edit-button" title="ערוך דמות">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                    </svg>
                </div>` : ''}
        `;
        spritesList.appendChild(spriteCard);

        const spriteContainer = document.createElement('div');
        spriteContainer.id = `container-${id}`;
        spriteContainer.classList.add('sprite-container');
        const mainSprite = document.createElement('div');
        mainSprite.classList.add('sprite-wrapper');
        mainSprite.id = id;
        mainSprite.innerHTML = `
            <img src="${imageUrl}" alt="${name}">
            <canvas class="hidden absolute top-0 left-0 w-full h-full"></canvas>
            <div class="speech-bubble"></div>
        `;
        
        spriteContainer.appendChild(mainSprite);
        stageArea.appendChild(spriteContainer);

        if (spriteData.isGif) {
            loadGifData(spriteData);
        }
        
        const wrapper = spriteContainer.querySelector('.sprite-wrapper');
        wrapper.addEventListener('click', (e) => { e.stopPropagation(); if (justDragged) return; handleSpriteClick(id); });
        wrapper.addEventListener('mousedown', (e) => startDrag(e, id));
        wrapper.addEventListener('touchstart', (e) => startDrag(e, id));
        
        spriteCard.addEventListener('click', () => setActiveSprite(id));
        spriteCard.querySelector('.delete-button').addEventListener('click', (e) => { e.stopPropagation(); deleteSprite(id); });
        if (isCustom && window.characterCreator) {
            spriteCard.querySelector('.edit-button').addEventListener('click', (e) => {
                e.stopPropagation();
                window.characterCreator.openForEdit(id);
            });
        }


        updateSpriteAppearance(id);
    };

    const loadProject = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        isLoadingProject = true; // Set flag before loading

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);

                // Robust check for valid project structure
                if (typeof projectData !== 'object' || projectData === null || 
                    typeof projectData.sprites !== 'object' || projectData.sprites === null || 
                    !Array.isArray(projectData.backdrops)) {
                    throw new Error("קובץ פרויקט לא תקין.");
                }
                
                stopAllScripts();
                Object.keys(sprites).forEach(id => {
                    document.getElementById(`container-${id}`)?.remove();
                    document.querySelector(`.sprite-card[data-sprite-id="${id}"]`)?.remove();
                });

                sprites = {};
                activeSpriteId = null;
                workspace.clear();
                backdropsList.innerHTML = '';
                nextZIndex = 10;
                
                projectData.backdrops.forEach(createBackdropCard);

                window.switchBackdrop(projectData.currentBackdrop);

                let maxZ = 9;
                Object.values(projectData.sprites).forEach(spriteData => {
                    loadSpriteFromData(spriteData);
                    if (spriteData.zIndex && spriteData.zIndex > maxZ) {
                        maxZ = spriteData.zIndex;
                    }
                });
                nextZIndex = maxZ + 1;
                
                const firstSpriteId = Object.keys(projectData.sprites)[0];
                if (firstSpriteId) {
                    setActiveSprite(firstSpriteId);
                }
                
                log('הפרויקט נטען בהצלחה.');

            } catch (error) {
                console.error("שגיאה בטעינת הפרויקטים:", error);
                alert("שגיאה בטעינת הפרויקטים:\n" + error.message);
            } finally {
                e.target.value = null;
                setTimeout(() => { isLoadingProject = false; }, 100); // Unset flag after a short delay
            }
        };
         reader.onerror = () => {
            console.error("שגיאה בקריאת הקובץ.");
            isLoadingProject = false; // Unset flag on error
        };
        reader.readAsText(file);
    };

    saveButton.addEventListener('click', saveProject);
    loadButton.addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', loadProject);


    // --- Properties Panel Listeners ---
    function setupPropertiesPanelListeners() {
        propName.addEventListener('change', (e) => {
            const sprite = getActiveSprite();
            if (sprite) sprite.name = e.target.value;
        });
        propX.addEventListener('change', (e) => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.x = Number(e.target.value);
                window.refreshSprite(sprite);
            }
        });
        propY.addEventListener('change', (e) => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.y = Number(e.target.value);
                window.refreshSprite(sprite);
            }
        });
        propSize.addEventListener('change', (e) => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.size = Number(e.target.value);
                window.refreshSprite(sprite);
            }
        });
        
        propDirection.addEventListener('change', (e) => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.direction = Number(e.target.value);
                window.refreshSprite(sprite);
            }
        });
        
        propDirection.addEventListener('click', (e) => {
            e.stopPropagation();
            const sprite = getActiveSprite();
            if (!sprite) return;
            
            anglePickerWidget.style.display = 'flex';
            const inputRect = propDirection.getBoundingClientRect();
            const widgetWidth = anglePickerWidget.offsetWidth;
            const widgetHeight = anglePickerWidget.offsetHeight;

            let left = inputRect.left - widgetWidth - 10;
            let top = inputRect.top + (inputRect.height / 2) - (widgetHeight / 2);

            if (left < 5) { 
                left = inputRect.left + (inputRect.width / 2) - (widgetWidth / 2);
                top = inputRect.bottom + 5;
            }
             if (top < 5) top = 5;
            if (top + widgetHeight > window.innerHeight) top = window.innerHeight - widgetHeight - 5;

            anglePickerWidget.style.top = `${top}px`;
            anglePickerWidget.style.left = `${left}px`;
            anglePickerHandle.style.transform = `rotate(${sprite.direction - 90}deg)`;
        });

        propShow.addEventListener('click', () => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.opacity = 1;
                window.refreshSprite(sprite);
            }
        });
        propHide.addEventListener('click', () => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.opacity = 0;
                window.refreshSprite(sprite);
            }
        });
        
        // Rotation Style Listeners
        propRotationAllAround.addEventListener('click', () => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.rotationStyle = 'all-around';
                window.refreshSprite(sprite);
            }
        });
        propRotationLeftRight.addEventListener('click', () => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.rotationStyle = 'left-right';
                window.refreshSprite(sprite);
            }
        });
        propRotationDontRotate.addEventListener('click', () => {
            const sprite = getActiveSprite();
            if (sprite) {
                sprite.rotationStyle = 'dont-rotate';
                window.refreshSprite(sprite);
            }
        });

        // GIF Animation Panel Listeners
        gifSpeedSlider.addEventListener('input', (e) => {
            const sprite = getActiveSprite();
            if (sprite && sprite.isGif) {
                sprite.gifSpeed = Number(e.target.value);
                gifSpeedValue.textContent = `${sprite.gifSpeed.toFixed(1)}x`;
            }
        });
        gifPlayPauseBtn.addEventListener('click', () => {
            const sprite = getActiveSprite();
            if (sprite && sprite.isGif && sprite.animation) {
                sprite.animation.previewIsPlaying = !sprite.animation.previewIsPlaying;
                if(sprite.animation.previewIsPlaying) {
                    sprite.animation.timeSinceLastFrame = 0; // Reset timer on play
                }
                updatePropertiesPanel(); // Update icon
            }
        });
    }
    
    // --- Custom Angle Picker Logic ---
    let isDraggingAngle = false;

    const updateAngleFromEvent = (e) => {
         const sprite = getActiveSprite();
         if (!sprite) return;

        const dialRect = anglePickerDial.getBoundingClientRect();
        const centerX = dialRect.left + dialRect.width / 2;
        const centerY = dialRect.top + dialRect.height / 2;
        const pointer = e.touches ? e.touches[0] : e;
        const deltaX = pointer.clientX - centerX;
        const deltaY = pointer.clientY - centerY;
        
        let degrees = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);
        if (degrees < 0) degrees += 360;
        degrees = Math.round(degrees);
        if (degrees === 360) degrees = 0;

        sprite.direction = degrees;
        propDirection.value = degrees;
        anglePickerHandle.style.transform = `rotate(${degrees - 90}deg)`;
        window.refreshSprite(sprite);
    };

    anglePickerDial.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDraggingAngle = true;
        updateAngleFromEvent(e);
    });
    anglePickerDial.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDraggingAngle = true;
        updateAngleFromEvent(e);
    });

    document.addEventListener('mousemove', (e) => { if (isDraggingAngle) updateAngleFromEvent(e); });
    document.addEventListener('touchmove', (e) => { if (isDraggingAngle) updateAngleFromEvent(e); });
    document.addEventListener('mouseup', () => { isDraggingAngle = false; });
    document.addEventListener('touchend', () => { isDraggingAngle = false; });
    document.addEventListener('click', (e) => {
        if (!anglePickerWidget.contains(e.target) && e.target !== propDirection) {
            anglePickerWidget.style.display = 'none';
        }
    });

    // --- GIF Animation Logic ---
    async function loadGifData(sprite) {
        try {
            const response = await fetch(sprite.imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const gifData = parseGIF(arrayBuffer);

            sprite.animation = {
                width: gifData.width,
                height: gifData.height,
                frames: gifData.frames,
                loopCount: gifData.loopCount,
                isPlaying: false,
                previewIsPlaying: false,
                currentFrame: 0,
                timeSinceLastFrame: 0,
                patchCanvas: document.createElement('canvas'),
            };
            sprite.animation.patchCanvas.width = gifData.width;
            sprite.animation.patchCanvas.height = gifData.height;

            const wrapper = document.getElementById(sprite.id);
            if (wrapper) {
                const img = wrapper.querySelector('img');
                const canvas = wrapper.querySelector('canvas');
                img.classList.add('hidden');
                canvas.classList.remove('hidden');
                canvas.width = gifData.width;
                canvas.height = gifData.height;
            }
            
            drawGifFrame(sprite);
            updatePropertiesPanel();

        } catch (e) {
            console.error(`Failed to load or parse GIF for sprite ${sprite.name}:`, e);
            sprite.isGif = false;
        }
    }
    
    function drawGifFrame(sprite) {
        if (!sprite.isGif || !sprite.animation) return;
        
        const frame = sprite.animation.frames[sprite.animation.currentFrame];
        if (!frame) return;
        
        const { width, height, patchCanvas } = sprite.animation;
        const patchCtx = patchCanvas.getContext('2d');
        
        if (sprite.animation.currentFrame === 0 || frame.disposalMethod === 2) {
             patchCtx.clearRect(0, 0, width, height);
        }

        const imageData = patchCtx.createImageData(frame.w, frame.h);
        const transparentIndex = frame.transparentColorIndex;

        frame.pixelIndices.forEach((pixel, i) => {
            if (pixel !== transparentIndex) {
                const color = frame.colorTable[pixel];
                if (color) {
                    imageData.data[i * 4 + 0] = color[0];
                    imageData.data[i * 4 + 1] = color[1];
                    imageData.data[i * 4 + 2] = color[2];
                    imageData.data[i * 4 + 3] = 255; // Opaque
                }
            }
            // Pixels with the transparent index will be left as rgba(0,0,0,0) by default
        });
        
        patchCtx.putImageData(imageData, frame.left, frame.top);
        
        const wrapper = document.getElementById(sprite.id);
        if (wrapper) {
            const canvas = wrapper.querySelector('canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(patchCanvas, 0, 0);
            }
        }
    }

    function updateGifAnimations(deltaTime) {
        Object.values(sprites).forEach(sprite => {
            if (sprite.isGif && sprite.animation && sprite.animation.frames.length > 0 && (sprite.animation.isPlaying || sprite.animation.previewIsPlaying)) {
                sprite.animation.timeSinceLastFrame += deltaTime;
                const currentFrameData = sprite.animation.frames[sprite.animation.currentFrame];
                const requiredDelay = (currentFrameData.delay * 10) / sprite.gifSpeed;

                if (sprite.animation.timeSinceLastFrame >= requiredDelay) {
                    sprite.animation.currentFrame = (sprite.animation.currentFrame + 1) % sprite.animation.frames.length;
                    sprite.animation.timeSinceLastFrame = 0;
                    drawGifFrame(sprite);
                }
            }
        });
    }
    
    // --- Main Game Loop / Tick ---
    function tick(timestamp) {
        if (!lastTimestamp) {
            lastTimestamp = timestamp;
        }
        // Calculate delta time, with a fallback for the first frame or pauses
        const deltaTime = (timestamp - lastTimestamp) || (1000 / 60);
        lastTimestamp = timestamp;
        // Cap delta time to prevent huge jumps if the tab was inactive
        window.frameDeltaTime = Math.min(deltaTime, 100);

        if (scriptRunner) {
            scriptRunner.tick();
        }
        
        // GIF animations are updated based on real time for smoothness
        updateGifAnimations(window.frameDeltaTime);

        requestAnimationFrame(tick);
    }
    
    
    // --- NEW SOUND SYSTEM (INTEGRATED) ---

    function populateSoundGallery() {
        if (soundGalleryGrid.childElementCount > 0) return;

        const allSounds = [
            { name: "Boat Start", url: "https://codejredu.github.io/test/assets/sound/BoatStart.mp3" },
            { name: "Car Door", url: "https://codejredu.github.io/test/assets/sound/CARDOOR.mp3" },
            { name: "Elevator Ding", url: "https://codejredu.github.io/test/assets/sound/ElevatorDing.mp3" },
            { name: "Water Emptying", url: "https://codejredu.github.io/test/assets/sound/WaterEmptying.mp3" },
            { name: "Water Vole Diving", url: "https://codejredu.github.io/test/assets/sound/WaterVole.mp3" },
            { name: "Air Land", url: "https://codejredu.github.io/test/assets/sound/airland.mp3" },
            { name: "Airplane Cessna", url: "https://codejredu.github.io/test/assets/sound/airplanecessna.mp3" },
            { name: "Airplane F15", url: "https://codejredu.github.io/test/assets/sound/airplanef15.mp3" },
            { name: "Animal Howl", url: "https://codejredu.github.io/test/assets/sound/animals.mp3" },
            { name: "Crowd", url: "https://codejredu.github.io/test/assets/sound/crowds.mp3" },
            { name: "Bird Call", url: "https://codejredu.github.io/test/assets/sound/double.mp3" },
            { name: "Partridge", url: "https://codejredu.github.io/test/assets/sound/grey.mp3" },
            { name: "Pygmy Shrew", url: "https://codejredu.github.io/test/assets/sound/pygmy.mp3" },
            { name: "School", url: "https://codejredu.github.io/test/assets/sound/school.mp3" },
        ];

        allSounds.forEach(sound => {
            const thumb = document.createElement('div');
            thumb.className = 'sound-thumbnail';
            thumb.dataset.url = sound.url;
            thumb.dataset.name = sound.name;
            thumb.innerHTML = `
                <input type="checkbox" class="sound-thumbnail-checkbox">
                <svg class="sound-thumbnail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
                <span class="sound-thumbnail-name">${sound.name}</span>
            `;
            thumb.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') {
                    // Handle checkbox click
                    if (e.target.checked) {
                        selectedSoundsForAdd.add(sound.url);
                        thumb.classList.add('selected-for-add');
                    } else {
                        selectedSoundsForAdd.delete(sound.url);
                        thumb.classList.remove('selected-for-add');
                    }
                } else {
                    // Handle thumbnail click (play preview)
                    if (currentPreviewAudio && !currentPreviewAudio.paused) {
                        currentPreviewAudio.pause();
                        if (currentPreviewAudio.src === sound.url) {
                            currentPreviewAudio = null;
                            return;
                        }
                    }
                    currentPreviewAudio = new Audio(sound.url);
                    currentPreviewAudio.play();
                }
            });
            soundGalleryGrid.appendChild(thumb);
        });
    }

    function addSoundsToSprite(sprite, sounds) {
        sounds.forEach(sound => {
            if (!sprite.sounds.some(s => s.url === sound.url)) {
                sprite.sounds.push(sound);
            }
        });
        renderSpriteSounds(sprite);
        workspace.refreshToolboxSelection();
    }
    
    function deleteSoundFromSprite(sprite, soundUrl) {
        sprite.sounds = sprite.sounds.filter(s => s.url !== soundUrl);
        renderSpriteSounds(sprite);
        workspace.refreshToolboxSelection();
    }

    function renderSpriteSounds(sprite) {
        soundsList.innerHTML = '';
        if (!sprite || !sprite.sounds) return;

        sprite.sounds.forEach(sound => {
            const card = document.createElement('div');
            card.className = 'sound-card';
            card.dataset.url = sound.url;
            card.innerHTML = `
                <div class="delete-button">X</div>
                <svg class="sound-card-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span class="sound-card-name">${sound.name}</span>
            `;
            card.querySelector('.delete-button').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSoundFromSprite(sprite, sound.url);
            });
            card.addEventListener('click', () => {
                const audio = new Audio(sound.url);
                audio.play();
            });
            soundsList.appendChild(card);
        });
    }

    addSoundButton.addEventListener('click', () => {
        populateSoundGallery();
        openGallery(soundGallery);
        selectedSoundsForAdd.clear();
        soundGalleryGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        soundGalleryGrid.querySelectorAll('.sound-thumbnail').forEach(t => t.classList.remove('selected-for-add'));
    });
    
    closeSoundGalleryButton.addEventListener('click', () => {
        soundGallery.classList.remove('visible');
        if (currentPreviewAudio) {
            currentPreviewAudio.pause();
            currentPreviewAudio = null;
        }
    });

    addSelectedSoundsButton.addEventListener('click', () => {
        const sprite = getActiveSprite();
        if (!sprite) return;

        const soundsToAdd = [];
        selectedSoundsForAdd.forEach(url => {
            const thumb = soundGalleryGrid.querySelector(`.sound-thumbnail[data-url="${url}"]`);
            if (thumb) {
                soundsToAdd.push({ name: thumb.dataset.name, url: url });
            }
        });

        addSoundsToSprite(sprite, soundsToAdd);
        soundGallery.classList.remove('visible');
    });

    // --- Sound Recorder Logic ---

    function showRecorderMessage(msg, isError = true) {
        recorderMessage.textContent = msg;
        recorderMessage.className = `w-full text-center p-3 rounded-lg border ${isError ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`;
        recorderMessage.classList.remove('hidden');
    }
    
    function hideRecorderMessage() {
         recorderMessage.classList.add('hidden');
    }

    async function startRecording() {
        hideRecorderMessage();
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(mediaStream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(recordedBlob);
                recorderAudioPreview.src = audioUrl;
                updateRecorderUI('preview');
                mediaStream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            updateRecorderUI('recording');
            
            let seconds = 0;
            recorderTimer.textContent = `0.0 / 15.0`;
            recorderTimerInterval = setInterval(() => {
                seconds += 0.1;
                recorderTimer.textContent = `${seconds.toFixed(1)} / 15.0`;
                if (seconds >= 15) {
                    stopRecording();
                }
            }, 100);

        } catch (err) {
            console.error("Error starting recording:", err);
            showRecorderMessage('לא ניתן לגשת למיקרופון. אנא בדוק הרשאות.');
            updateRecorderUI('idle');
        }
    }
    
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        clearInterval(recorderTimerInterval);
    }
    
    function saveRecording() {
        const sprite = getActiveSprite();
        const soundName = recorderSoundName.value.trim() || `הקלטה ${sprite.sounds.length + 1}`;
        if (recordedBlob && sprite) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const dataUrl = event.target.result;
                addSoundsToSprite(sprite, [{ name: soundName, url: dataUrl }]);
                soundRecorderModal.classList.add('hidden');
                updateRecorderUI('idle');
            };
            reader.readAsDataURL(recordedBlob);
        }
    }

    function updateRecorderUI(state) {
        recorderRecordBtn.classList.toggle('hidden', state !== 'idle');
        recorderStopBtn.classList.toggle('hidden', state !== 'recording');
        recorderRerecordBtn.classList.toggle('hidden', state !== 'preview');
        recorderSaveBtn.classList.toggle('hidden', state !== 'preview');
        recorderPreviewContainer.classList.toggle('hidden', state !== 'preview');
        recorderVisualizer.classList.toggle('is-recording', state === 'recording');
        
        if (state === 'idle') {
            recorderTimer.textContent = '0.0 / 15.0';
            recorderSoundName.value = '';
        }
    }
    
    recordSoundHeaderButton.addEventListener('click', () => {
        if(!getActiveSprite()) {
            alert("יש לבחור דמות לפני הקלטת צליל.");
            return;
        }
        soundRecorderModal.classList.remove('hidden');
        updateRecorderUI('idle');
        hideRecorderMessage();
    });

    recorderCloseBtn.addEventListener('click', () => {
        stopRecording();
        if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
        soundRecorderModal.classList.add('hidden');
    });

    recorderRecordBtn.addEventListener('click', startRecording);
    recorderStopBtn.addEventListener('click', stopRecording);
    recorderRerecordBtn.addEventListener('click', () => updateRecorderUI('idle'));
    recorderSaveBtn.addEventListener('click', saveRecording);


    // --- File Upload Logic ---
    function handleFileUpload(file, type) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const name = file.name.split('.')[0];
            
            if (type === 'sprite') {
                createNewSprite(name, dataUrl, 0, 0);
            } else if (type === 'backdrop') {
                const newCard = createBackdropCard(dataUrl);
                window.switchBackdrop(dataUrl);
            } else if (type === 'sound') {
                const sprite = getActiveSprite();
                if (sprite) {
                    addSoundsToSprite(sprite, [{ name: name, url: dataUrl }]);
                } else {
                     alert("יש לבחור דמות לפני העלאת צליל.");
                }
            }
        };
        reader.readAsDataURL(file);
    }
    
    // --- Gallery Initialization and Listeners ---
    function initGalleries() {
        document.getElementById('add-sprite-button').addEventListener('click', () => openGallery(spriteGallery));
        document.getElementById('upload-sprite-header-button').addEventListener('click', () => document.getElementById('sprite-upload-input').click());
        document.getElementById('sprite-upload-input').addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'sprite'));
        document.getElementById('close-sprite-gallery-button').addEventListener('click', () => spriteGallery.classList.remove('visible'));
        document.getElementById('sprite-thumbnails-grid').addEventListener('click', handleSpriteGallerySelection);
        
        document.getElementById('create-sprite-header-button').addEventListener('click', () => {
            if (window.characterCreator) {
                window.characterCreator.open();
            }
        });

        document.getElementById('add-backdrop-button').addEventListener('click', () => openGallery(backgroundGallery));
        document.getElementById('upload-backdrop-header-button').addEventListener('click', () => document.getElementById('backdrop-upload-input').click());
        document.getElementById('backdrop-upload-input').addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'backdrop'));
        document.getElementById('close-gallery-button').addEventListener('click', () => backgroundGallery.classList.remove('visible'));
        backdropsList.addEventListener('click', handleBackdropSelection);
        document.getElementById('thumbnails-grid').addEventListener('click', handleGallerySelection);
        
        uploadSoundHeaderButton.addEventListener('click', () => soundUploadInput.click());
        soundUploadInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'sound'));
    }

    // --- Character Creator Integration ---
    window.characterCreator = initCharacterCreator({
        getSprite: (spriteId) => sprites[spriteId],
        onSave: ({ name, dataUrl, characterData, editingSpriteId }) => {
            if (editingSpriteId && sprites[editingSpriteId]) {
                // Update existing sprite
                const sprite = sprites[editingSpriteId];
                sprite.imageUrl = dataUrl;
                sprite.characterData = characterData;
                
                // Update on stage
                const wrapper = document.getElementById(sprite.id);
                if(wrapper) wrapper.querySelector('img').src = dataUrl;

                // Update card
                const card = document.querySelector(`.sprite-card[data-sprite-id="${sprite.id}"]`);
                if(card) card.querySelector('img').src = dataUrl;
            } else {
                 // Create new sprite
                const newName = name || `דמות ${Object.keys(sprites).length + 1}`;
                createNewSprite(newName, dataUrl, 0, 0, true, characterData);
            }
        }
    });

    // --- Layer Control Logic ---
    window.changeSpriteLayer = (sprite, action) => {
        if (!sprite) return;
        const sortedSprites = Object.values(sprites).sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));
        const currentIndex = sortedSprites.findIndex(s => s.id === sprite.id);
        if (currentIndex === -1) return;

        switch (action) {
            case 'FRONT':
                if (currentIndex < sortedSprites.length - 1) {
                    const topZ = sortedSprites[sortedSprites.length - 1].zIndex;
                    sprite.zIndex = topZ + 1;
                    window.refreshSprite(sprite);
                }
                break;
            case 'BACK':
                if (currentIndex > 0) {
                    const bottomZ = sortedSprites[0].zIndex;
                    sprite.zIndex = bottomZ - 1;
                    window.refreshSprite(sprite);
                }
                break;
            case 'FORWARD':
                if (currentIndex < sortedSprites.length - 1) {
                    const nextSprite = sortedSprites[currentIndex + 1];
                    [sprite.zIndex, nextSprite.zIndex] = [nextSprite.zIndex, sprite.zIndex];
                    window.refreshSprite(sprite);
                    window.refreshSprite(nextSprite);
                }
                break;
            case 'BACKWARD':
                if (currentIndex > 0) {
                    const prevSprite = sortedSprites[currentIndex - 1];
                    [sprite.zIndex, prevSprite.zIndex] = [prevSprite.zIndex, sprite.zIndex];
                    window.refreshSprite(sprite);
                    window.refreshSprite(prevSprite);
                }
                break;
        }
    };


    // --- App Initialization ---
    setupPropertiesPanelListeners();
    initGalleries();
    createDefaultBackdrop();
    createDefaultSprite();
    requestAnimationFrame(tick);
});