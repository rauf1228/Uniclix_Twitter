import React from 'react';
import { connect } from 'react-redux';
import TwitterLogin from 'react-twitter-auth';
import SweetAlert from "sweetalert2-react";
import { Prompt } from 'react-router';
import { withRouter } from "react-router";
import { twitterRequestTokenUrl, twitterAccessTokenUrl } from "../../config/api";
import { startAddTwitterChannel, startSetChannels } from "../../actions/channels";
import channelSelector from "../../selectors/channels";
import { destroyChannel } from "../../requests/channels";
import { cancelSubscription } from "../../requests/billing";
import { logout } from "../../actions/auth";
import Loader from "../../components/Loader";
import ChannelItems from "./ChannelItems";
import UpgradeAlert from "../UpgradeAlert";

class Twitter extends React.Component {
    constructor(props) {
        super(props);
    }

    defaultAction = {
        id: "",
        type: ""
    };

    state = {
        action: this.defaultAction,
        error: "",
        forbidden: false,
        shouldBlockNavigation: true
    }

    setAction = (action = this.defaultAction) => {
        this.setState(() => ({
            action
        }));
    }

    componentDidUpdate = () => {
        if (this.state.shouldBlockNavigation) {
            window.onbeforeunload = true
        } else {
            window.onbeforeunload = undefined
        }
    }

    onFailure = (response) => {
        console.log(response);
    };

    setError = (error) => {
        this.setState(() => ({
            error
        }));
    };

    setForbidden = (forbidden = false) => {
        this.setState(() => ({
            forbidden
        }));
    };

    onSuccess = (response) => {
        response.json().then(body => {
            this.props.startAddTwitterChannel(body.oauth_token, body.oauth_token_secret)
                .catch(error => {
                    if (error.response.status === 403) {
                        this.setForbidden(true);
                        return;
                    }

                    if (error.response.status === 409) {
                        this.setError("This twitter account is already registered from another uniclix account.");
                    }
                    else {
                        this.setError("Something went wrong!");
                    }
                });
        });
    };

    remove = (id) => {
        return destroyChannel(id)
            .then((response) => {
                this.props.startSetChannels()
                    .then((response) => {
                        // if(response.length < 1){
                        //     this.props.logout();
                        // }
                        this.setState(() => ({
                            action: this.defaultAction
                        }));
                    });
            }).catch((e) => {
                if (typeof e.response !== "undefined" && typeof e.response.data.error !== "undefined") {
                    this.setState(() => ({
                        error: e.response.data.error
                    }));
                    return;
                }
            });
    }

    startCheckout = () => {
        this.setState({ shouldBlockNavigation: false })
        setTimeout(() => {
            this.props.history.push('/twitter-booster/checkout')
        }, 0)
    }

    cancelSubscription = () => {
        return cancelSubscription()
            .then((response) => {
                this.props.startSetChannels()
                    .then((response) => {
                        console.log(response)
                        this.setState(() => ({
                            action: this.defaultAction
                        }));
                    });
            }).catch((e) => {
                if (typeof e.response !== "undefined" && typeof e.response.data.error !== "undefined") {
                    this.setState(() => ({
                        error: e.response.data.error
                    }));
                    return;
                }
            });
    }

    render() {
        const { shouldBlockNavigation } = this.state
        const { profile } = this.props
        return (
            <React.Fragment>
                <Prompt
                    when={shouldBlockNavigation}
                    message='If you leave the page without proceeding to checkout all the accounts you linked will be lost.'
                />
                <div className="main-container">
                    <UpgradeAlert isOpen={this.state.forbidden} text={"Your current plan does not support more accounts."} setForbidden={this.setForbidden} />
                    <SweetAlert
                        show={!!this.state.action.id}
                        title={`Do you wish to ${this.state.action.type} this item?`}
                        text="To confirm your decision, please click one of the buttons below."
                        showCancelButton
                        type="warning"
                        confirmButtonText="Yes"
                        cancelButtonText="No"
                        onConfirm={() => {
                            if (this.state.action.type === 'delete') {
                                this.remove(this.state.action.id);
                            } else {
                                console.log('something went wrong');
                            }
                        }}
                    />

                    <SweetAlert
                        show={!!this.state.error}
                        title={`Error`}
                        text={this.state.error}
                        type="error"
                        confirmButtonText="Ok"
                        cancelButtonText="No"
                        onConfirm={() => {
                            this.setError("");
                        }}
                    />

                    <div className="row">
                        <div className="col-md-6">
                            <div className="section-header no-border col-md-12">
                                <div className="section-header__first-row">
                                    <h2>Manage Accounts</h2>
                                </div>

                                <div className="section-header__second-row">
                                    <h3>Linked Accounts</h3>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="row mt20">
                        <div className="col-md-7">

                            <div className="col-md-12">
                                <ChannelItems channels={this.props.channels} setAction={this.setAction} />
                                {!!this.props.loading && <Loader />}

                                <div className="accounts-container__content__wrapper__footer">
                                    <TwitterLogin loginUrl={twitterAccessTokenUrl}
                                        onFailure={this.onFailure}
                                        onSuccess={this.onSuccess}
                                        requestTokenUrl={twitterRequestTokenUrl}
                                        showIcon={true}
                                        forceLogin={true}
                                        className="add-channel-plus-btn">
                                        <i className="fa fa-plus"></i>
                                    </TwitterLogin>
                                    <span className="left-side-label">Add account</span>
                                </div>
                            </div>

                        </div>
                        {!!profile.subscription ?
                            (!profile.subscription.activeSubscription ?
                                <div className="col-md-5">
                                    <div className="col-md-12 plan-info-container">
                                        <h3>Trial</h3>

                                        <div className="plan-content">
                                            <p className="plan-content-description">3 days left trial</p>
                                            <p className="plan-content-accounts">x{this.props.channels.length} accounts</p>
                                        </div>

                                        <button className="btn-blue" onClick={() => { this.startCheckout() }}>Start subscription</button>
                                    </div>
                                </div>
                                :
                                <div className="col-md-5">
                                    <div className=" plan-info-container">
                                        <h3>My Plan
                                            <button
                                                className="btn-text-pink"
                                                onClick={() => this.cancelSubscription}
                                            >Cancel subscription</button></h3>

                                        <div className="plan-content table">
                                            <div className="row-price">
                                                <div className="col-price">
                                                    <p className="plan-content-description">Current price</p>
                                                    <p className="plan-content-accounts">x{this.props.channels.length} accounts</p>
                                                </div>
                                                <div className="col-price">
                                                    <p className="price">$10</p>
                                                </div>
                                            </div>
                                            <br />
                                            <div className="row-price new-accounts">
                                                <div className="col-price">
                                                    <p className="plan-content-accounts">x2 accounts</p>
                                                </div>
                                                <div className="col-price">
                                                    <p className="price">$20</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="order-total table">
                                            <div className="row-price">
                                                <div className="col-price">
                                                    <p className="plan-content-description">TOTAL</p>
                                                    <p className="plan-content-accounts">Monthly</p>
                                                </div>
                                                <div className="col-price">
                                                    <p className="price">$30</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="btn-blue" onClick={() => { this.startCheckout() }}>Go to checkout</button>
                                    </div>
                                </div>
                            ) : ""
                        }
                    </div>
                </div>
            </React.Fragment>
        );
    };
}

const mapStateToProps = (state) => {

    const twitterChannelsFilter = { selected: undefined, provider: "twitter" };
    const channels = channelSelector(state.channels.list, twitterChannelsFilter);
    const profile = state.profile
    return {
        channels,
        profile,
        loading: state.channels.loading
    };
};

const mapDispatchToProps = (dispatch) => ({
    startAddTwitterChannel: (accessToken, accessTokenSecret) => dispatch(startAddTwitterChannel(accessToken, accessTokenSecret)),
    startSetChannels: () => dispatch(startSetChannels()),
    logout: () => dispatch(logout())
});


export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Twitter));