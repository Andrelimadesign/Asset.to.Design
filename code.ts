// Figma Plugin: Import Images to Named Layers
// Enhanced version with better mapping algorithms and progress reporting

// Enhanced data structures for image importing
interface ImageFile {
  name: string;          // Filename without extension
  extension: string;     // File extension (png, jpg, jpeg, svg)
  data: Uint8Array;      // Binary file data
  size: number;          // File size in bytes
}

interface ImportResult {
  totalImages: number;
  mapped: number;
  skipped: number;
  skippedDetails: Array<{
    filename: string;
    reason: string;
  }>;
}

interface LayerMatch {
  layer: SceneNode;
  path: string;          // Visual path for user feedback
  type: string;          // Layer type for validation
  canFill: boolean;      // Whether layer supports image fills
}

// Global storage for import data
let lastImportResult: ImportResult | null = null;

// Enhanced selection validation with better error messages
function validateSingleFrameSelection(): FrameNode {
  console.log("🔍 Validating selection...");
  const selection = figma.currentPage.selection;
  console.log("Selection length:", selection.length);
  
  if (selection.length === 0) {
    throw new Error("Please select a frame to work with");
  }
  
  if (selection.length > 1) {
    throw new Error("Please select only one frame at a time");
  }
  
  const selectedNode = selection[0];
  console.log("Selected item type:", selectedNode.type);
  
  if (selectedNode.type !== "FRAME") {
    throw new Error("Selected item must be a Frame. Please select a frame and try again.");
  }
  
  console.log("✅ Selection validated successfully");
  return selectedNode as FrameNode;
}

// Enhanced layer indexing with better structure analysis
function indexNamedLayers(frameNode: FrameNode): Map<string, LayerMatch[]> {
  console.log("🔍 Indexing named layers in frame:", frameNode.name);
  const layerMap = new Map<string, LayerMatch[]>();
  let maxDepth = 0;
  let nodeCount = 0;
  
  // Use iterative DFS to avoid recursion limits
  const stack: Array<{node: SceneNode, path: string[], depth: number}> = [
    {node: frameNode, path: [frameNode.name], depth: 0}
  ];
  
  while (stack.length > 0) {
    const {node, path, depth} = stack.pop()!;
    nodeCount++;
    maxDepth = Math.max(maxDepth, depth);
    
    // Check if this layer can hold an image fill
    const canFill = canHaveImageFill(node);
    
    if (node.name && node.name.trim() !== "" && canFill) {
      const layerName = node.name.toLowerCase().trim();
      
      if (!layerMap.has(layerName)) {
        layerMap.set(layerName, []);
      }
      
      layerMap.get(layerName)!.push({
        layer: node,
        path: path.join(" → "),
        type: node.type,
        canFill
      });
    }
    
    if ("children" in node) {
      // Add children in reverse order for correct DFS traversal
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({
          node: node.children[i],
          path: [...path, node.children[i].name || `${node.children[i].type}`],
          depth: depth + 1
        });
      }
    }
  }
  
  console.log(`✅ Indexed ${layerMap.size} named layers out of ${nodeCount} total nodes`);
  console.log(`📊 Frame structure: max depth ${maxDepth}, named layers: ${layerMap.size}`);
  
  return layerMap;
}

// Function to check if a node can have image fills
function canHaveImageFill(node: SceneNode): boolean {
  return node.type === "RECTANGLE" ||
         node.type === "FRAME" ||
         node.type === "ELLIPSE" ||
         node.type === "POLYGON" ||
         node.type === "STAR" ||
         node.type === "VECTOR" ||
         (node.type === "COMPONENT" && "fills" in node) ||
         (node.type === "INSTANCE" && "fills" in node);
}

// Enhanced image mapping and application with progress reporting
async function applyImagesToLayers(
  imageFiles: ImageFile[],
  layerMap: Map<string, LayerMatch[]>,
  onProgress?: (percent: number) => void
): Promise<ImportResult> {
  console.log("🔄 Applying images to layers with enhanced algorithm...");
  
  let mapped = 0;
  let skipped = 0;
  const skippedDetails: Array<{filename: string; reason: string}> = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    const matchingLayers = layerMap.get(imageFile.name);
    
    if (!matchingLayers || matchingLayers.length === 0) {
      skippedDetails.push({
        filename: `${imageFile.name}.${imageFile.extension}`,
        reason: "No matching layer found"
      });
      skipped++;
      continue;
    }
    
    try {
      // Create image in Figma
      const image = figma.createImage(imageFile.data);
      
      // Apply to the first matching layer (or all if multiple)
      const targetLayer = matchingLayers[0].layer as any;
      
      if (!targetLayer.fills) {
        skippedDetails.push({
          filename: `${imageFile.name}.${imageFile.extension}`,
          reason: "Layer does not support fills"
        });
        skipped++;
        continue;
      }
      
      // Create image fill
      const imageFill: ImagePaint = {
        type: "IMAGE",
        scaleMode: "FILL", // Options: FILL, CROP, FIT, TILE
        imageHash: image.hash
      };
      
      // Apply the fill
      targetLayer.fills = [imageFill];
      mapped++;
      
      console.log(`✅ Applied image ${imageFile.name}.${imageFile.extension} to layer: ${targetLayer.name}`);
      
      // Report progress
      if (onProgress) {
        const percent = Math.round(((i + 1) / imageFiles.length) * 100);
        onProgress(percent);
      }
      
    } catch (error) {
      skippedDetails.push({
        filename: `${imageFile.name}.${imageFile.extension}`,
        reason: `Error applying image: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      skipped++;
      console.error(`❌ Failed to apply image ${imageFile.name}.${imageFile.extension}:`, error);
    }
  }
  
  console.log(`✅ Image application complete: ${mapped} mapped, ${skipped} skipped`);
  return {
    totalImages: imageFiles.length,
    mapped,
    skipped,
    skippedDetails
  };
}

// Helper function to find a node at a specific path in a frame
function findNodeAtPath(frame: FrameNode, path: number[]): SceneNode | null {
  if (path.length === 0) return frame;
  
  let currentNode: SceneNode = frame;
  
  for (const index of path) {
    if ("children" in currentNode && currentNode.children[index]) {
      currentNode = currentNode.children[index];
    } else {
      return null; // Path is invalid
    }
  }
  
  return currentNode;
}

// Helper function to find the parent frame of a node
function findParentFrame(node: SceneNode): FrameNode | null {
  let current = node.parent;
  
  while (current) {
    if (current.type === "FRAME") {
      return current as FrameNode;
    }
    current = current.parent;
  }
  
  return null;
}

// Enhanced message handlers with progress reporting
console.log("🚀 Enhanced image import plugin starting...");
figma.showUI(__html__, {width: 380, height: 450});

// Add selection change listener to detect frame selection
figma.on('selectionchange', () => {
  updateSelectionFeedback();
});

// Initial feedback update
updateSelectionFeedback();

figma.ui.onmessage = async (msg) => {
  console.log("📨 Received message:", msg);
  
  try {
    switch (msg.type) {
      case "IMPORT_IMAGES":
        console.log("📸 Handling IMPORT_IMAGES request...");
        await handleImageImport(msg.imageFiles);
        break;
      case "SELECT_SKIPPED_LAYER":
        console.log("🎯 Handling SELECT_SKIPPED_LAYER request...");
        await handleSelectSkippedLayer(msg.index, msg.layerName);
        break;
      case "FOCUS_VIEWPORT_ON_LAYER":
        console.log("🔍 Handling FOCUS_VIEWPORT_ON_LAYER request...");
        await handleFocusViewportOnLayer(msg.index, msg.layerName);
        break;
      default:
        console.log("⚠️ Unknown message type:", msg.type);
    }
  } catch (error) {
    console.error("❌ Error handling message:", error);
    figma.ui.postMessage({
      type: "ERROR",
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

// Function to check current selection and update UI feedback
function updateSelectionFeedback(): void {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 1 && selection[0].type === "FRAME") {
    const frame = selection[0] as FrameNode;
    figma.ui.postMessage({
      type: "FRAME_SELECTED",
      frameName: frame.name
    });
  } else {
    figma.ui.postMessage({
      type: "NO_FRAME_SELECTED"
    });
  }
}

async function handleImageImport(imageFilesData: any[]): Promise<void> {
  console.log("📸 Starting image import...");
  
  try {
    const frame = validateSingleFrameSelection();
    console.log("📸 Target frame selected:", frame.name);
    
    // Convert received data to ImageFile format
    const imageFiles: ImageFile[] = imageFilesData.map(fileData => ({
      name: fileData.name,
      extension: fileData.extension,
      data: new Uint8Array(fileData.data),
      size: fileData.size
    }));
    
    console.log("📸 Processing", imageFiles.length, "image files");
    
    const layerMap = indexNamedLayers(frame);
    const result = await applyImagesToLayers(
      imageFiles, 
      layerMap,
      (percent) => {
        figma.ui.postMessage({
          type: "PROGRESS",
          percent
        });
      }
    );
    
    // Store result for potential layer selection
    lastImportResult = result;
    
    figma.ui.postMessage({
      type: "IMPORT_COMPLETE",
      result
    });
    
    console.log("✅ Image import completed successfully");
  } catch (error) {
    console.error("❌ Image import failed:", error);
    throw error;
  }
}

async function handleSelectSkippedLayer(index: number, layerName: string): Promise<void> {
  console.log("🎯 Starting layer selection for:", layerName, "at index:", index);
  
  try {
    if (!lastImportResult) {
      throw new Error("No import data available");
    }
    
    // Get the current page selection to find the target frame
    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || selection[0].type !== "FRAME") {
      throw new Error("Please select a target frame first");
    }
    
    const targetFrame = selection[0] as FrameNode;
    
    // Find the layer by name in the target frame
    const layerMap = indexNamedLayers(targetFrame);
    const matchingLayers = layerMap.get(layerName.toLowerCase());
    
    if (!matchingLayers || matchingLayers.length === 0) {
      throw new Error(`Layer "${layerName}" not found in the selected frame`);
    }
    
    const targetNode = matchingLayers[0].layer;
    
    // Select the node and focus the viewport
    figma.currentPage.selection = [targetNode];
    
    // Ensure the selection is visible by briefly selecting and deselecting
    setTimeout(() => {
      // Re-select to ensure the selection is properly highlighted
      figma.currentPage.selection = [targetNode];
    }, 100);
    
    // Enhanced viewport focusing with multiple strategies
    try {
      console.log("🎯 Starting enhanced viewport focusing...");
      
      // Notify UI that viewport focusing is starting
      figma.ui.postMessage({
        type: "VIEWPORT_FOCUSING"
      });
      
      // Log the node's position for debugging
      const nodeBounds = targetNode.absoluteBoundingBox;
      if (nodeBounds) {
        console.log("📍 Node bounds:", {
          x: nodeBounds.x,
          y: nodeBounds.y,
          width: nodeBounds.width,
          height: nodeBounds.height
        });
      }
      
      // Strategy 1: Direct viewport focusing
      console.log("🎯 Strategy 1: Direct viewport focus...");
      figma.viewport.scrollAndZoomIntoView([targetNode]);
      console.log("✅ Direct viewport focus completed");
      
      // Strategy 2: Check if node is visible and refocus if needed
      if (nodeBounds) {
        const centerX = nodeBounds.x + nodeBounds.width / 2;
        const centerY = nodeBounds.y + nodeBounds.height / 2;
        const viewportCenter = figma.viewport.center;
        
        console.log("🎯 Viewport center:", viewportCenter);
        console.log("🎯 Node center:", { x: centerX, y: centerY });
        
        // Calculate distance from viewport center
        const distanceX = Math.abs(centerX - viewportCenter.x);
        const distanceY = Math.abs(centerY - viewportCenter.y);
        const tolerance = 150; // Increased tolerance for better detection
        
        if (distanceX > tolerance || distanceY > tolerance) {
          console.log("🔄 Node is outside viewport tolerance, using enhanced focusing...");
          
          // Strategy 3: Enhanced focusing with parent frame context
          try {
            const parentFrame = findParentFrame(targetNode);
            if (parentFrame && parentFrame !== targetNode) {
              console.log("🔄 Strategy 3: Focusing on parent frame first...");
              figma.viewport.scrollAndZoomIntoView([parentFrame]);
              
              // Wait a bit, then focus on the specific node
              setTimeout(() => {
                try {
                  figma.viewport.scrollAndZoomIntoView([targetNode]);
                  console.log("✅ Enhanced focusing with parent frame completed");
                } catch (enhancedError) {
                  console.log("⚠️ Enhanced focusing failed:", enhancedError);
                }
              }, 300);
            }
          } catch (parentError) {
            console.log("⚠️ Parent frame focusing failed:", parentError);
          }
          
          // Strategy 4: Multiple rapid focus attempts
          console.log("🔄 Strategy 4: Multiple rapid focus attempts...");
          for (let i = 0; i < 3; i++) {
            try {
              figma.viewport.scrollAndZoomIntoView([targetNode]);
              console.log(`✅ Rapid focus attempt ${i + 1} completed`);
            } catch (rapidError) {
              console.log(`⚠️ Rapid focus attempt ${i + 1} failed:`, rapidError);
            }
          }
        } else {
          console.log("✅ Node is already within viewport tolerance");
        }
      }
      
      // Strategy 5: Final verification and adjustment
      setTimeout(() => {
        try {
          console.log("🔄 Strategy 5: Final verification and adjustment...");
          figma.viewport.scrollAndZoomIntoView([targetNode]);
          console.log("✅ Final viewport adjustment completed");
          
          // Notify UI that viewport focusing is complete
          figma.ui.postMessage({
            type: "VIEWPORT_SUCCESS"
          });
          
        } catch (finalError) {
          console.log("⚠️ Final viewport adjustment failed:", finalError);
        }
      }, 500);
      
    } catch (viewportError) {
      console.log("⚠️ Primary viewport focusing failed:", viewportError);
      
      // Emergency fallback: try to focus on parent frame
      try {
        console.log("🚨 Emergency fallback: focusing on parent frame...");
        const parentFrame = findParentFrame(targetNode);
        if (parentFrame && parentFrame !== targetNode) {
          figma.viewport.scrollAndZoomIntoView([parentFrame]);
          console.log("✅ Emergency fallback completed");
        }
      } catch (emergencyError) {
        console.log("🚨 Emergency fallback also failed:", emergencyError);
      }
    }
    
    // Show a notification to the user with more helpful information
    const layerType = targetNode.type.toLowerCase();
    figma.notify(`Selected ${layerType}: "${targetNode.name || layerName}" - Check the canvas for the highlighted layer`, {timeout: 3000});
    
    // Show success message
    figma.ui.postMessage({
      type: "SELECTION_SUCCESS",
      layerName: targetNode.name || layerName
    });
    
    console.log("✅ Layer selection completed successfully");
  } catch (error) {
    console.error("❌ Layer selection failed:", error);
    figma.ui.postMessage({
      type: "SELECTION_ERROR",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleFocusViewportOnLayer(index: number, layerName: string): Promise<void> {
  console.log("🔍 Starting viewport focus for:", layerName, "at index:", index);
  
  try {
    if (!lastImportResult) {
      throw new Error("No import data available");
    }
    
    // Get the current page selection to find the target frame
    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || selection[0].type !== "FRAME") {
      throw new Error("Please select a target frame first");
    }
    
    const targetFrame = selection[0] as FrameNode;
    
    // Find the layer by name in the target frame
    const layerMap = indexNamedLayers(targetFrame);
    const matchingLayers = layerMap.get(layerName.toLowerCase());
    
    if (!matchingLayers || matchingLayers.length === 0) {
      throw new Error(`Layer "${layerName}" not found in the selected frame`);
    }
    
    const targetNode = matchingLayers[0].layer;
    
    // Focus viewport without changing selection
    try {
      console.log("🔍 Focusing viewport on layer without changing selection...");
      
      // Notify UI that viewport focusing is starting
      figma.ui.postMessage({
        type: "VIEWPORT_FOCUSING"
      });
      
      // Aggressive viewport focusing
      figma.viewport.scrollAndZoomIntoView([targetNode]);
      
      // Wait and try again for better results
      setTimeout(() => {
        try {
          figma.viewport.scrollAndZoomIntoView([targetNode]);
          console.log("✅ Secondary viewport focus completed");
        } catch (secondaryError) {
          console.log("⚠️ Secondary viewport focus failed:", secondaryError);
        }
      }, 200);
      
      // Final attempt
      setTimeout(() => {
        try {
          figma.viewport.scrollAndZoomIntoView([targetNode]);
          console.log("✅ Final viewport focus completed");
          
          // Notify UI that viewport focusing is complete
          figma.ui.postMessage({
            type: "VIEWPORT_SUCCESS"
          });
          
        } catch (finalError) {
          console.log("⚠️ Final viewport focus failed:", finalError);
        }
      }, 500);
      
    } catch (viewportError) {
      console.log("⚠️ Viewport focusing failed:", viewportError);
      
      // Try parent frame as fallback
      try {
        const parentFrame = findParentFrame(targetNode);
        if (parentFrame && parentFrame !== targetNode) {
          figma.viewport.scrollAndZoomIntoView([parentFrame]);
          console.log("✅ Fallback to parent frame completed");
        }
      } catch (fallbackError) {
        console.log("⚠️ Fallback to parent frame also failed:", fallbackError);
      }
    }
    
    // Show notification
    figma.notify(`Viewport focused on: ${targetNode.name || layerName}`, {timeout: 2000});
    
    console.log("✅ Viewport focusing completed successfully");
  } catch (error) {
    console.error("❌ Viewport focusing failed:", error);
    figma.ui.postMessage({
      type: "SELECTION_ERROR",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

console.log("✅ Enhanced image import plugin initialization complete");
