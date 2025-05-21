export function maxAreaOfIsland(grid, playerValue = 1) {
  if (!grid || grid.length === 0) {
    return 0
  }

  const rows = grid.length
  const cols = grid[0].length
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))
  let maxArea = 0

  function dfs(row, col) {
    if (row < 0 || row >= rows || col < 0 || col >= cols || visited[row][col] || grid[row][col] !== playerValue) {
      return 0;
    }
    
    visited[row][col] = true
    return 1 + dfs(row - 1, col) + dfs(row + 1, col) + dfs(row, col - 1) + dfs(row, col + 1);
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === playerValue && !visited[row][col]) {
        const area = dfs(row, col)

        if (area > maxArea) {
          maxArea = area
        }
      }
    }
  }

  return maxArea
}