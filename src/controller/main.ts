import { invoke, process } from "@tauri-apps/api"
import { nmConfig, readNmConfig, roConfig, saveNmConfig, setNmConfig } from "../services/config"
import { rcloneInfo } from "../services/rclone"
import { rclone_api_post } from "../utils/rclone/request"
import { startUpdateCont } from "./stats/continue"
import { reupMount } from "./storage/mount/mount"
import { reupStorage } from "./storage/storage"
import { listenWindow, windowsHide } from "./window"
import { NMConfig } from "../type/config"
import { randomString } from "../utils/utils"
import { t } from "i18next"
import { startRclone, stopRclone } from "../utils/rclone/process"
import { getOsInfo } from "../utils/tauri/osInfo"
import { startTaskScheduler } from "./task/task"
import { autoMount } from "./task/autoMount"
import { setThemeMode } from "./setting/setting"
import { setLocalized } from "./language/localized"
import { checkNotice } from "./update/notice"

async function init(setStartStr: Function) {

    setStartStr(t('init'))

    listenWindow()

    await getOsInfo()

    setStartStr(t('read_config'))
    await readNmConfig()


    if (nmConfig.settings.startHide) {
        windowsHide()
    }
    
    if (nmConfig.settings.language) {
        await setLocalized(nmConfig.settings.language);
    } else {
        const matchingLang = roConfig.options.setting.language.select.find(
            (lang) => lang.langCode === navigator.language.toLowerCase()
        );
        nmConfig.settings.language = matchingLang?.value || roConfig.options.setting.language.select[roConfig.options.setting.language.defIndex].value;
        await setLocalized(nmConfig.settings.language);
    }

    setThemeMode(nmConfig.settings.themeMode)

    await checkNotice()

    await startRclone()

    startUpdateCont()
    await reupRcloneVersion()
    await reupStorage()
    await reupMount()

    //自动挂载
    await autoMount()

    //开始任务队列
    await startTaskScheduler()
}

async function reupRcloneVersion() {
    const ver = await rclone_api_post(
        '/core/version',
    )
    rcloneInfo.version = ver
    console.log(rcloneInfo.version);
}

function main() {

}

async function exit() {
    await stopRclone()
    await saveNmConfig()
    await process.exit();
}

export { init, main, exit }