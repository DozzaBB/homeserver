export interface FResponse {
    data: {
        chromecastData: {
            ip?: string,
            name?: string
        }
        hiddenTerms: string[],
        files: string[],
        watched: Record<string, string>
    }
}

export interface Config {
    // VLC binary location for chromecast
    VLC_PATH: string, 
    // Path to scan for media files
    SHOWS_DIR: string,
    // Where to save the lowdb JSON file
    DB_LOCATION: string,
    // Where to save logs.
    LOG_FOLDER: string,

}