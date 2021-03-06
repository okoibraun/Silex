/**
 * @fileoverview This is the dialog box containing the
 *     Cloud Explorer file picker
 *     this is only the UI part, to let user choose a file in the cloud
 *     @see silex.service.CloudStorage     for the service/network part
 *
 */

import { ModalDialog } from '../../components/ModalDialog'
import { CloudExplorer } from '../../externs'
import { CloudStorage, FileInfo } from '../../io/CloudStorage'
import { SilexNotification } from '../Notification'
import { getUiElements } from '../../ui-store/UiElements'

/**
 * the Silex FileExplorer class
 * @class {silex.view.dialog.FileExplorer}
 */
export class FileExplorer {
  static get IMAGE_EXTENSIONS() {
    return ['.jpg', '.jpeg', '.png', '.gif', '.svg']
  }
  static get HTML_EXTENSIONS() {
    return ['.html', '.htm']
  }

  // singleton pattern
  // FIXME: refactor it as a function and use import
  static getInstance(): FileExplorer {
    FileExplorer.instance = FileExplorer.instance || new FileExplorer()
    return FileExplorer.instance
  }
  private static instance: FileExplorer

  /**
   * reference to the filepicker instance
   */
  ce: CloudExplorer = null

  // make this a dialog
  modalDialog: any

  private constructor() {
    const element = getUiElements().fileExplorer

    // cloud explorer instance
    CloudStorage.getInstance().ready(() => {
      this.ce = CloudStorage.getInstance().ce
    })
    this.modalDialog = new ModalDialog({name: 'File explorer', element, onOpen: (args) => {}, onClose: () => {}})
  }

  /**
   * method passed to then in order to add the desired path format everywhere in
   * silex
   */
  addAbsPath(fileInfo: FileInfo): FileInfo {
    if (fileInfo === null) {
      return fileInfo
    }
    const absPath = fileInfo.service ? `/ce/${fileInfo.service}/get/${fileInfo.path}` : fileInfo.absPath
    return (Object.assign(
      {absPath},
      fileInfo) as FileInfo)
  }

  /**
   * pick file
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  async openFile(opt_extensions?: string[]): Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.openFile(opt_extensions)
    if (fileInfo && fileInfo.attribution) { await this.promptAttribution(fileInfo.attribution) }
    this.close()
    return this.addAbsPath(fileInfo)
  }

  async promptAttribution(attribution) {
    return new Promise((resolve, reject) => {
      SilexNotification.confirm('Attribution for his image', `
        <p>
          ${attribution.message}
        </p><br/>
        <code>
          ${attribution.content}
        </code>
      `, (ok) => {
        if (ok) {
          resolve()
          const copyText = document.createElement('div')
          document.body.appendChild(copyText)
          try {
            copyText.innerHTML = attribution.content
            const range = document.createRange()
            range.selectNode(copyText)
            window.getSelection().addRange(range)
            const success = document.execCommand('copy')
            if (success) {
              SilexNotification.notifySuccess('Attribution copied to clipboard')
            } else {
              SilexNotification.notifyError('Attribution has not been copied to clipboard')
              console.error('Could not copy to clipboard', attribution)
            }
          } catch (err) {
            SilexNotification.notifyError('Attribution has not been copied to clipboard')
            console.error('Could not copy to clipboard', err, attribution)
          }
          document.body.removeChild(copyText)
        } else {
          resolve()
        }
      }, 'Copy', 'Ignore')
    })
  }

  /**
   * pick multiple files
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  async openFiles(opt_extensions?: string[]): Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.openFiles(opt_extensions)
    const fileInfo_2 = this.addAbsPath(fileInfo)
    this.close()
    return fileInfo_2
  }

  /**
   * pick a folder
   */
  async openFolder(): Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.openFolder()
    const fileInfo_2 = this.addAbsPath(fileInfo)
    this.close()
    return fileInfo_2
  }

  /**
   * choose a name for the file
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  async saveAs(defaultName: string, opt_extensions?: string[]):
      Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.saveAs(defaultName, opt_extensions)
    const fileInfo_2 = this.addAbsPath(fileInfo)
    this.close()
    return fileInfo_2
  }

  /**
   * Open the editor
   */
  open() {
    this.modalDialog.open()
  }

  /**
   * Close the editor
   */
  close() {
    this.modalDialog.close()
  }
}
