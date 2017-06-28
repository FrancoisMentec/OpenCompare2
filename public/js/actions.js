/**
 * The ActionList is here to store a list of action and easily perform undo/redo
 */
class ActionList {
  /**
   * @param {Object} env - The environement (can be null, an editor, a chartFactory, ...), refer to action's environement
   */
  constructor (env) {
    this.env = env
    this.list = []
    this.index = 0
  }

  get length () {
    return this.list.length
  }

  /**
   * Push an action in the list (Undone actions will be lost) and PERFORM IT !
   * @param {Action} action - The action to push
   * @param {boolean} stack - If true, stack the action on the last entry (so mutiple action can be undo/redo at once)
   */
  push (action, stack = false) {
    if (this.index != this.length) {
      this.list.splice(this.index, this.length - this.index)
    }

    if (stack && this.index > 0) {
      this.list[this.index - 1].push(action)
    } else {
      this.list.push([action])
    }

    action.perform(this.env) // Action is performed

    this.index = this.length
  }

  /**
   * Undo previous action
   * @return {boolean} If an action has been undone
   */
  undo () {
    if (this.index > 0) {
      var actions = this.list[--this.index]
      for (var a = 0, la = actions.length; a < la; a++) {
        actions[a].undo(this.env)
      }
      return true
    }
    return false
  }

  /**
   * Redo next action
   * @return {boolean} If an action has been redone
   */
  redo () {
    if (this.index < this.length) {
      var actions = this.list[this.index++]
      for (var a = 0, la = actions.length; a < la; a++) {
        actions[a].perform(this.env)
      }
      return true
    }
    return false
  }
}

/* Actions */

class CellEditAction {
  constructor (cell, newValue) {
    this.cell = cell
    this.oldValue = cell.value
    this.newValue = newValue
  }

  perform (editor) {
    editor.emit('editCell', {
      productId: this.cell.product.id,
      featureId: this.cell.featureId,
      value: this.newValue
    })
  }

  undo (editor) {
    editor.emit('editCell', {
      productId: this.cell.product.id,
      featureId: this.cell.featureId,
      value: this.oldValue
    })
  }
}

class RemoveFeatureAction {
  constructor (feature) {
    this.feature = feature.export()
    this.cellsByProductId = {}
    for (var i in feature.pcm.productsById) {
      this.cellsByProductId[i] = feature.pcm.productsById[i].cellsByFeatureId[feature.id].export()
    }
  }

  perform (editor) {
    editor.emit('removeFeature', this.feature.id)
  }

  undo (editor) {
    editor.emit('addFeature', {
      feature: this.feature,
      cellsByProductId: this.cellsByProductId
    })
  }
}
