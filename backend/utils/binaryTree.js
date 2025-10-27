const User = require('../models/User');

/**
 * Find the best position for a new user in the binary tree
 * @param {String} sponsorId - The sponsor's user ID
 * @returns {Object} - Contains parentId, position, and level
 */
async function findBinaryPosition(sponsorId) {
  try {
    const sponsor = await User.findById(sponsorId);
    
    if (!sponsor) {
      throw new Error('Sponsor not found');
    }

    // If sponsor has no children, place the new user as left child
    if (!sponsor.leftChild && !sponsor.rightChild) {
      return {
        parentId: sponsorId,
        position: 'left',
        level: sponsor.level + 1,
      };
    }

    // If sponsor has only left child, place as right child
    if (sponsor.leftChild && !sponsor.rightChild) {
      return {
        parentId: sponsorId,
        position: 'right',
        level: sponsor.level + 1,
      };
    }

    // If sponsor has both children, use spillover logic
    return await findSpilloverPosition(sponsorId);

  } catch (error) {
    console.error('Error finding binary position:', error);
    throw error;
  }
}

/**
 * Find spillover position when sponsor's direct positions are filled
 * @param {String} sponsorId - The sponsor's user ID
 * @returns {Object} - Contains parentId, position, and level
 */
async function findSpilloverPosition(sponsorId) {
  try {
    // Use breadth-first search to find the first available position in the sponsor's downline
    const queue = [sponsorId];
    const visited = new Set();

    while (queue.length > 0) {
      const currentUserId = queue.shift();
      
      if (visited.has(currentUserId)) continue;
      visited.add(currentUserId);

      const currentUser = await User.findById(currentUserId)
        .populate('leftChild rightChild');

      if (!currentUser) continue;

      // Check if current user has an available position
      if (!currentUser.leftChild) {
        return {
          parentId: currentUserId,
          position: 'left',
          level: currentUser.level + 1,
        };
      }

      if (!currentUser.rightChild) {
        return {
          parentId: currentUserId,
          position: 'right',
          level: currentUser.level + 1,
        };
      }

      // Add children to queue for further search
      if (currentUser.leftChild) {
        queue.push(currentUser.leftChild._id);
      }
      if (currentUser.rightChild) {
        queue.push(currentUser.rightChild._id);
      }
    }

    // If no position found in the current tree, place under sponsor
    return {
      parentId: sponsorId,
      position: 'left', // This should rarely happen
      level: (await User.findById(sponsorId)).level + 1,
    };

  } catch (error) {
    console.error('Error finding spillover position:', error);
    throw error;
  }
}

/**
 * Update parent's child reference when a new user is placed
 * @param {String} parentId - Parent user ID
 * @param {String} childId - New child user ID
 * @param {String} position - 'left' or 'right'
 */
async function updateParentChild(parentId, childId, position) {
  try {
    const updateField = position === 'left' ? 'leftChild' : 'rightChild';
    
    await User.findByIdAndUpdate(parentId, {
      [updateField]: childId,
    });

  } catch (error) {
    console.error('Error updating parent child:', error);
    throw error;
  }
}

/**
 * Get the complete binary tree structure for a user
 * @param {String} userId - Root user ID
 * @param {Number} depth - Maximum depth to retrieve (default: 5)
 * @returns {Object} - Tree structure with user details
 */
async function getBinaryTree(userId, depth = 5) {
  try {
    if (depth <= 0) return null;

    const user = await User.findById(userId)
      .select('firstName lastName userId currentStage leftCount rightCount totalDownline')
      .populate('leftChild rightChild');

    if (!user) return null;

    const tree = {
      id: user._id,
      userId: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      stage: user.currentStage,
      leftCount: user.leftCount,
      rightCount: user.rightCount,
      totalDownline: user.totalDownline,
      children: {
        left: null,
        right: null,
      },
    };

    // Recursively build tree for children
    if (user.leftChild) {
      tree.children.left = await getBinaryTree(user.leftChild._id, depth - 1);
    }

    if (user.rightChild) {
      tree.children.right = await getBinaryTree(user.rightChild._id, depth - 1);
    }

    return tree;

  } catch (error) {
    console.error('Error getting binary tree:', error);
    throw error;
  }
}

/**
 * Get all users in a specific level of the binary tree
 * @param {String} rootUserId - Root user ID
 * @param {Number} targetLevel - Target level to retrieve
 * @returns {Array} - Array of users in the target level
 */
async function getUsersByLevel(rootUserId, targetLevel) {
  try {
    const rootUser = await User.findById(rootUserId);
    if (!rootUser) return [];

    const users = [];
    const queue = [{ userId: rootUserId, level: rootUser.level }];

    while (queue.length > 0) {
      const { userId, level } = queue.shift();

      if (level === targetLevel) {
        const user = await User.findById(userId)
          .select('firstName lastName userId currentStage email phoneNumber');
        if (user) users.push(user);
        continue;
      }

      if (level < targetLevel) {
        const currentUser = await User.findById(userId)
          .populate('leftChild rightChild');

        if (currentUser) {
          if (currentUser.leftChild) {
            queue.push({
              userId: currentUser.leftChild._id,
              level: level + 1,
            });
          }

          if (currentUser.rightChild) {
            queue.push({
              userId: currentUser.rightChild._id,
              level: level + 1,
            });
          }
        }
      }
    }

    return users;

  } catch (error) {
    console.error('Error getting users by level:', error);
    throw error;
  }
}

/**
 * Calculate total count for left and right legs
 * @param {String} userId - User ID
 * @returns {Object} - Contains leftTotal and rightTotal
 */
async function calculateLegCounts(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return { leftTotal: 0, rightTotal: 0 };

    const leftTotal = await countNodesInSubtree(user.leftChild);
    const rightTotal = await countNodesInSubtree(user.rightChild);

    return { leftTotal, rightTotal };

  } catch (error) {
    console.error('Error calculating leg counts:', error);
    throw error;
  }
}

/**
 * Count all nodes in a subtree
 * @param {String} rootId - Root node ID
 * @returns {Number} - Total count of nodes
 */
async function countNodesInSubtree(rootId) {
  if (!rootId) return 0;

  try {
    const user = await User.findById(rootId).populate('leftChild rightChild');
    if (!user) return 0;

    let count = 1; // Count the root node

    // Recursively count left and right subtrees
    if (user.leftChild) {
      count += await countNodesInSubtree(user.leftChild._id);
    }

    if (user.rightChild) {
      count += await countNodesInSubtree(user.rightChild._id);
    }

    return count;

  } catch (error) {
    console.error('Error counting nodes in subtree:', error);
    return 0;
  }
}

/**
 * Get all downline users for a given user
 * @param {String} userId - User ID
 * @param {Number} maxDepth - Maximum depth to search (default: 10)
 * @returns {Array} - Array of all downline users
 */
async function getAllDownline(userId, maxDepth = 10) {
  try {
    const downline = [];
    const queue = [{ userId, depth: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      const { userId: currentUserId, depth } = queue.shift();

      if (depth >= maxDepth || visited.has(currentUserId)) continue;
      visited.add(currentUserId);

      const user = await User.findById(currentUserId)
        .select('firstName lastName userId currentStage email phoneNumber createdAt')
        .populate('leftChild rightChild');

      if (!user) continue;

      // Don't include the root user in downline
      if (depth > 0) {
        downline.push({
          ...user.toObject(),
          depth,
          position: depth === 1 ? 
            (user.position || 'direct') : 
            'indirect',
        });
      }

      // Add children to queue
      if (user.leftChild) {
        queue.push({
          userId: user.leftChild._id,
          depth: depth + 1,
        });
      }

      if (user.rightChild) {
        queue.push({
          userId: user.rightChild._id,
          depth: depth + 1,
        });
      }
    }

    return downline.sort((a, b) => a.depth - b.depth);

  } catch (error) {
    console.error('Error getting all downline:', error);
    throw error;
  }
}

/**
 * Check if user placement would create a balanced tree
 * @param {String} parentId - Parent user ID
 * @param {String} position - 'left' or 'right'
 * @returns {Boolean} - True if placement creates balance
 */
async function checkTreeBalance(parentId, position) {
  try {
    const parent = await User.findById(parentId);
    if (!parent) return false;

    const { leftTotal, rightTotal } = await calculateLegCounts(parentId);

    // Check if the new placement improves balance
    const newLeftTotal = position === 'left' ? leftTotal + 1 : leftTotal;
    const newRightTotal = position === 'right' ? rightTotal + 1 : rightTotal;

    const currentImbalance = Math.abs(leftTotal - rightTotal);
    const newImbalance = Math.abs(newLeftTotal - newRightTotal);

    return newImbalance <= currentImbalance;

  } catch (error) {
    console.error('Error checking tree balance:', error);
    return false;
  }
}

/**
 * Find the path from root to a specific user
 * @param {String} rootId - Root user ID
 * @param {String} targetId - Target user ID
 * @returns {Array} - Path array with user IDs and positions
 */
async function findPathToUser(rootId, targetId) {
  try {
    if (rootId === targetId) return [{ userId: rootId, position: 'root' }];

    const queue = [{ userId: rootId, path: [{ userId: rootId, position: 'root' }] }];
    const visited = new Set();

    while (queue.length > 0) {
      const { userId, path } = queue.shift();

      if (visited.has(userId)) continue;
      visited.add(userId);

      const user = await User.findById(userId).populate('leftChild rightChild');
      if (!user) continue;

      // Check left child
      if (user.leftChild) {
        const newPath = [...path, { userId: user.leftChild._id, position: 'left' }];
        
        if (user.leftChild._id.toString() === targetId) {
          return newPath;
        }

        queue.push({ userId: user.leftChild._id, path: newPath });
      }

      // Check right child
      if (user.rightChild) {
        const newPath = [...path, { userId: user.rightChild._id, position: 'right' }];
        
        if (user.rightChild._id.toString() === targetId) {
          return newPath;
        }

        queue.push({ userId: user.rightChild._id, path: newPath });
      }
    }

    return []; // Path not found

  } catch (error) {
    console.error('Error finding path to user:', error);
    return [];
  }
}

module.exports = {
  findBinaryPosition,
  findSpilloverPosition,
  updateParentChild,
  getBinaryTree,
  getUsersByLevel,
  calculateLegCounts,
  countNodesInSubtree,
  getAllDownline,
  checkTreeBalance,
  findPathToUser,
};