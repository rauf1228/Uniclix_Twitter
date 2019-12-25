import React from 'react';
import { NavLink, Link } from "react-router-dom";
import Popup from "reactjs-popup";
import { supportEmail } from "../../requests/profile";
import { ToastContainer } from "react-toastr";

let toastContainer;



const VerticalMenu = ({
    menuItems,
    channels,
    selectedChannel,
    selectChannel,
    trialEnded,
    toggleBox,
    isBoxVisible }) => {
console.log(isBoxVisible)
    return (
        <div>
            <button className="top-bar-trigger" onClick={() => toggleBox()}><i className="fa fa-bars"></i></button>
            <aside className={`vertical-menu scrollbar ${isBoxVisible ? 'open-sidebar' : ''}`}>
                <ProfileInfo
                    selectedChannel={selectedChannel}
                    channels={channels}
                    trialEnded={trialEnded}
                    selectChannel={selectChannel} />

                <MenuItems menuItems={menuItems} />
                <SupportSection />
            </aside>
        </div>

    );
};

class ProfileInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    state = {
        channelMenu: false,
        activeChannels: []
    }

    toggleDropdown = () => {
        this.setState(() => ({
            channelMenu: !this.state.channelMenu
        }));
    }

    activeChannels = (channels) => {
        let msDiff = new Date(this.props.trialEnded).getTime() - new Date().getTime();
        if (Math.floor(msDiff / (1000 * 60 * 60 * 24)) >= 0) {
            return channels
        } else {
            let activeChannels = channels.filter(channel => {
                if (channel.details.paid == 1)
                    return channel;
            });

            return activeChannels;
        }
    }

    render() {
        const { selectedChannel, selectChannel, channels } = this.props;

        return (

            <div>
                <div className="profile-info" onClick={this.toggleDropdown}>
                    <span className="pull-left profile-img-container">
                        <img onError={(e) => e.target.src = '/images/dummy_profile.png'} src={selectedChannel.avatar} />
                        <i className={`fab fa-${selectedChannel.type} ${selectedChannel.type}_bg smallIcon`}></i>
                    </span>
                    <div>
                        <p className="profile-username">{!!selectedChannel.username && `@${selectedChannel.username}`}</p>
                    </div>
                </div>

                <ProfileSelectionDropDown
                    channels={this.activeChannels(channels)}
                    selectChannel={selectChannel}
                    isOpen={this.state.channelMenu}
                />
            </div>

        );
    }
}

const ProfileSelectionDropDown = ({ channels, selectChannel, isOpen }) => (
    <div className={`channel-selection-menu select-channel ${isOpen ? 'is-open' : ''}`}>
        <div>
            {!!channels.length &&
                channels.map((channel) => (
                    <ProfileSelectionItem key={channel.id} channel={channel} selectChannel={selectChannel} />
                ))
            }
        </div>
    </div>
);

const ProfileSelectionItem = ({ channel, selectChannel }) => (
    <div className="channel-container">
        <a href="#" className="block-urls" onClick={(e) => { selectChannel(channel.id) }}>
            <div className="profile-info ">
                <span className="profile-img-container">
                    <img onError={(e) => e.target.src = '/images/dummy_profile.png'} src={channel.avatar} />
                    <i className={`fab fa-${channel.type} ${channel.type}_bg smallIcon`}></i>
                </span>
                <div>
                    <p className="profile-name" title={channel.name}>{channel.name}</p>
                    <p className="profile-username">{!!channel.username && `@${channel.username}`}</p>
                </div>
            </div>
        </a>
    </div>
);

class MenuItems extends React.Component {
    render() {
        const { menuItems } = this.props;

        return (
            <ul className="v-menu-links clear-both">
                {menuItems.map((item) => (
                    <li key={item.id} ><NavLink className="links" to={item.uri}><i className={`fa fa-${item.icon}`}></i> <span>{item.displayName}</span></NavLink></li>
                ))}
            </ul>
        );
    }
}

class SupportSection extends React.Component {
    state = {
        name: "",
        email: "",
        subject: "",
        message: "",
        open: false,
    }

    openModal = () => {
        this.setState({ open: true });
    }
    closeModal = () => {
        this.setState({ open: false });
    }
    onSubmit = (e) => {
        e.preventDefault();
        supportEmail({
            ...this.state
        }).then((response) => {
            this.resetState();
            this.closeModal();
            toastContainer.success('', "Success", { closeButton: true });
        }).catch((error) => {
            this.setState(() => ({
                error: "Something went wrong.",
                loading: false
            }));
        });
    }

    onFieldChange = (e) => {
        const id = e.target.id;
        let state = Object.assign({}, this.state);
        state[id] = e.target.value;
        this.setState(() => (state));
    };

    resetState() {
        this.state.name = "";
        this.state.email = "";
        this.state.subject = "";
        this.state.message = "";
    }

    render() {
        return (
            <div className="support">
                <ToastContainer
                    ref={ref => toastContainer = ref}
                    className="toast-top-right"
                />
                <button className="button" onClick={this.openModal}>
                    <i className="fa fa-comment"></i> Support
                </button>
                <Popup
                    open={this.state.open}
                    closeOnDocumentClick
                    onClose={this.closeModal}
                >
                    <div className="modal">
                        <a className="close" onClick={this.closeModal}>
                            &times;
                    </a>
                        <div className="content">
                            <form onSubmit={(e) => this.onSubmit(e)}>
                                <div className="form-group">
                                    <div className="column-container">
                                        <div className="col-12 form-field">
                                            <label htmlFor="name">Full Name</label>
                                            <input type="text"
                                                className="form-control whiteBg"
                                                onChange={(e) => this.onFieldChange(e)}
                                                id="name"
                                                value={this.state.name} />
                                        </div>

                                        <div className="col-12 form-field">
                                            <label htmlFor="email">Email addresse</label>
                                            <input type="email"
                                                className="form-control whiteBg"
                                                id="email"
                                                onChange={(e) => this.onFieldChange(e)}
                                                value={this.state.email} />
                                        </div>
                                        <div className="col-12 form-field">
                                            <label htmlFor="subject">Subject</label>
                                            <input type="text"
                                                className="form-control whiteBg"
                                                value={this.state.subject}
                                                onChange={(e) => this.onFieldChange(e)}
                                                name="website"
                                                id="subject" />
                                        </div>
                                        <div className="col-12 form-field">
                                            <label htmlFor="message">Message</label>
                                            <textarea
                                                className="form-control whiteBg"
                                                value={this.state.message}
                                                onChange={(e) => this.onFieldChange(e)}
                                                name="message" id="message"></textarea>
                                        </div>
                                        <div className="col-12">
                                            <button className="magento-btn">Send</button>
                                        </div>
                                    </div>

                                </div>
                            </form>
                        </div>
                    </div>
                </Popup>
            </div>
        );
    }
}

export default VerticalMenu;